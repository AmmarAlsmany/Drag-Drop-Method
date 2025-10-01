/**
 * BUControl WebSocket Service
 * Connects to BUControl's WebSocket API for real-time Q-SYS control
 */

class BUControlWebSocketService {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.listeners = new Map();
    this.requestId = 1;
    this.pendingRequests = new Map();

    this.wsUrl = 'ws://localhost:3000/ws';
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }


      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to controller updates
        this.send({
          type: 'subscribe',
          topic: 'controller:updates'
        });

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[BUControl WS] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.attemptReconnect();
      };

      // Timeout if connection takes too long
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect().catch(err => {
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(message) {
    if (!this.connected || !this.ws) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      try {
        const messageWithId = {
          ...message,
          id: this.requestId++
        };

        // Store the resolve/reject for this request
        this.pendingRequests.set(messageWithId.id, { resolve, reject });

        this.ws.send(JSON.stringify(messageWithId));

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.pendingRequests.has(messageWithId.id)) {
            this.pendingRequests.delete(messageWithId.id);
            reject(new Error('Request timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(message) {

    // Handle response to a pending request
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message);
      }
      return;
    }

    // Handle broadcast messages
    if (message.type) {
      this.notifyListeners(message.type, message);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[BUControl WS] Listener error for event ${event}:`, error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  // ==================== Aurora DIDO Commands ====================

  /**
   * Route sources with custom coordinates to output
   * @param {Array} sources - Array of {input: number, coordinates: {x, y, w, h}}
   * @param {number} output - Output number (1-4)
   */
async routeWithCoordinates(sources, output) {
    // Build controls matching Python API logic
    const controls = [];

    // Route inputs to intermediate outputs
    const availableOutputs = [1, 2, 3, 4];
    availableOutputs.splice(availableOutputs.indexOf(output), 1);

    sources.forEach((source, index) => {
      const intermediateOutput = availableOutputs[index];
      controls.push({
        Name: `Output${intermediateOutput}Route`,
        Type: 'Text',
        Value: `in${source.input}`
      });
    });

    // Enable windowing
    controls.push({
      Name: 'WindowingOutput',
      Type: 'Text',
      Value: `out${output}`
    });

    // Configure windows
    sources.forEach((source, index) => {
      const windowNum = index + 1;
      const intermediateOutput = availableOutputs[index];
      const coords = source.coordinates;

      controls.push(
        { Name: `Window${windowNum}Route`, Type: 'Text', Value: `out${intermediateOutput}` },
        { Name: `Window${windowNum}Enable`, Type: 'Boolean', Value: true },
        { Name: `Window${windowNum}_x`, Type: 'Text', Value: String(coords.x) },
        { Name: `Window${windowNum}_y`, Type: 'Text', Value: String(coords.y) },
        { Name: `Window${windowNum}_w`, Type: 'Text', Value: String(coords.w) },
        { Name: `Window${windowNum}_h`, Type: 'Text', Value: String(coords.h) }
      );
    });

    // Disable unused windows
    for (let i = sources.length + 1; i <= 4; i++) {
      controls.push({ Name: `Window${i}Enable`, Type: 'Boolean', Value: false });
    }

    // Send Q-SYS command through BUControl
    return this.send({
      topic: 'controller:command',
      payload: {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'Component.Set',
        params: {
          Name: 'AuroraDIDO',
          Controls: controls
        }
      }
    });
  }

  /**
   * Clear output (disable windowing)
   * @param {number} output - Output number to clear
   */
  async clearOutput(output) {
    return this.send({
      type: 'control:set',
      payload: {
        component: 'AuroraDIDO',
        controls: [
          { name: 'WindowingOutput', value: 'Disabled' },
          { name: 'Window1Enable', value: false },
          { name: 'Window2Enable', value: false },
          { name: 'Window3Enable', value: false },
          { name: 'Window4Enable', value: false }
        ]
      }
    });
  }

  /**
   * Enable windowing on specific output
   * @param {number} output - Output number (1-4)
   */
  async enableWindowing(output) {
    return this.send({
      type: 'control:set',
      payload: {
        component: 'AuroraDIDO',
        controls: [
          { name: 'WindowingOutput', value: `out${output}` }
        ]
      }
    });
  }

  /**
   * Route single input to output
   * @param {number} input - Input number (1-4)
   * @param {number} output - Output number (1-4)
   */
  async routeInputToOutput(input, output) {
    return this.send({
      type: 'control:set',
      payload: {
        component: 'AuroraDIDO',
        controls: [
          { name: `Output${output}Route`, value: `in${input}` }
        ]
      }
    });
  }

  /**
   * Get Q-SYS controller status
   */
  async getStatus() {
    return this.send({
      type: 'getState'
    });
  }
}

// Create singleton instance
const bucontrolWS = new BUControlWebSocketService();

export default bucontrolWS;
