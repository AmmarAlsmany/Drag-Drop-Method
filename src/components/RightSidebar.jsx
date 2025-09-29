import React from 'react'
import linkIcon from '../assets/righticon/link.png'
import microphoneIcon from '../assets/righticon/Microphone.png'
import speakerIcon from '../assets/righticon/SpeakerHigh.png'
import videoOffIcon from '../assets/righticon/VideoCameraSlash.png'
import recordIcon from '../assets/righticon/Record.png'
import uploadIcon from '../assets/righticon/Export.png'
import addUserIcon from '../assets/righticon/UserPlus.png'
import sparkleIcon from '../assets/righticon/Sparkle.png'
import downloadIcon from '../assets/righticon/Export.png'
import savePresetIcon from '../assets/righticon/Save Preset.png'

function RightSidebar() {
  const middleButtons = [
    { icon: microphoneIcon, label: 'Microphone', active: true },
    { icon: speakerIcon, label: 'Speaker', active: true },
    { icon: videoOffIcon, label: 'Video Off', active: false },
    { icon: recordIcon, label: 'Record', active: false },
    { icon: uploadIcon, label: 'Upload', active: false },
    { icon: addUserIcon, label: 'Add User', active: false },
    { icon: sparkleIcon, label: 'Effects', active: false },
    { icon: downloadIcon, label: 'Download', active: false }
  ]

  return (
    <div className="w-20 bg-black rounded-xl flex flex-col items-center justify-between py-4 h-full mr-1">
      {/* Link Icon - Top */}
      <div className="w-12 h-12 flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer rounded-full" title="Link">
        <img 
          src={linkIcon} 
          alt="Link" 
          className="w-8 h-8 object-contain"
        />
      </div>
      
      {/* Middle Icons - Centered */}
      <div className="flex flex-col items-center space-y-4 flex-1 justify-center">
        {middleButtons.map((button, index) => (
          <div
            key={index}
            className="w-12 h-12 flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer rounded-full"
            title={button.label}
          >
            <img 
              src={button.icon} 
              alt={button.label} 
              className="img-fluid"
            />
          </div>
        ))}
      </div>
      
      {/* Save Preset Button - Bottom */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center mb-2 hover:bg-green-500 transition-colors cursor-pointer rounded-full">
          <img 
            src={savePresetIcon} 
            alt="Save Preset" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <span className="text-white text-xs text-center">Save Preset</span>
      </div>
    </div>
  )
}

export default RightSidebar
