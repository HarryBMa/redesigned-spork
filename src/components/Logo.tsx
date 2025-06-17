interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
        style={{ width: size, height: size }}
      >
        H
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 text-lg leading-tight">
          Harrys
        </span>
        <span className="text-sm text-gray-600 leading-tight">
          lilla Lager
        </span>
      </div>
    </div>
  );
}
