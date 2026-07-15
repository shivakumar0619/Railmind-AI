import { FC } from 'react';

export type TrainCategory = 
  | 'freight' | 'passenger' | 'express' | 'superfast' 
  | 'rajdhani' | 'shatabdi' | 'vande bharat' | 'memu' 
  | 'emu' | 'military' | 'maintenance' | 'parcel' | 'default';

interface TrainIconProps {
  category: string;
  color?: string;
  bearing?: number;
  className?: string;
}

export const TrainIcon: FC<TrainIconProps> = ({ category, color = '#22c55e', bearing = 0, className = '' }) => {
  const cat = (category?.toLowerCase() || 'default') as TrainCategory;
  
  // Wrapper for rotation
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div 
      className={`relative flex items-center justify-center drop-shadow-md ${className}`}
      style={{ 
        transform: `rotate(${bearing}deg)`
      }}
    >
      {children}
    </div>
  );

  // Modern SVG Locomotive (Default / Express / Superfast)
  const ModernLoco = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="2" fill="#18181b" stroke={color} strokeWidth="1.5" />
      <path d="M7 6L17 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="9" y="9" width="6" height="5" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" />
      <circle cx="12" cy="17" r="1" fill={color} />
      {/* Front indicator arrow pointing UP (0 bearing = North) */}
      <path d="M12 2L9 5H15L12 2Z" fill={color} />
    </svg>
  );

  // Freight loco (Blocky, sturdy)
  const FreightLoco = () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="18" height="18" rx="1" fill="#18181b" stroke={color} strokeWidth="2" />
      <rect x="7" y="10" width="12" height="6" fill={color} fillOpacity="0.1" />
      <path d="M7 7H19" stroke={color} strokeWidth="2" />
      <path d="M13 3L9 6H17L13 3Z" fill={color} />
    </svg>
  );

  // Vande Bharat (Aerodynamic, sleek)
  const VandeBharat = () => (
    <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C8 4 6 8 6 12V26H18V12C18 8 16 4 12 4Z" fill="#18181b" stroke={color} strokeWidth="1.5" />
      <path d="M9 10C9 8.5 10.5 7 12 7C13.5 7 15 8.5 15 10V14H9V10Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
      <path d="M12 2L10 5H14L12 2Z" fill={color} />
    </svg>
  );

  // EMU/MEMU (Commuter, flat face)
  const CommuterTrain = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="14" height="18" rx="2" fill="#18181b" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="10" height="4" rx="0.5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" />
      <circle cx="8" cy="18" r="1" fill={color} />
      <circle cx="14" cy="18" r="1" fill={color} />
      <path d="M11 0L8 3H14L11 0Z" fill={color} />
    </svg>
  );

  // Maintenance (Crane/work vehicle)
  const MaintenanceVehicle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="14" height="16" fill="#18181b" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M12 12L12 6" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <path d="M12 2L9 5H15L12 2Z" fill={color} />
    </svg>
  );

  // Military (Armored/Stealthy)
  const MilitaryTrain = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L5 8V22H19V8L12 4Z" fill="#18181b" stroke={color} strokeWidth="1.5" />
      <rect x="9" y="10" width="6" height="6" fill={color} fillOpacity="0.4" />
      <path d="M12 2L10 5H14L12 2Z" fill={color} />
    </svg>
  );

  let Icon;
  switch (cat) {
    case 'vande bharat':
    case 'rajdhani':
    case 'shatabdi':
      Icon = VandeBharat;
      break;
    case 'freight':
    case 'parcel':
      Icon = FreightLoco;
      break;
    case 'emu':
    case 'memu':
    case 'passenger':
      Icon = CommuterTrain;
      break;
    case 'maintenance':
      Icon = MaintenanceVehicle;
      break;
    case 'military':
      Icon = MilitaryTrain;
      break;
    case 'express':
    case 'superfast':
    default:
      Icon = ModernLoco;
  }

  return <Wrapper><Icon /></Wrapper>;
};
