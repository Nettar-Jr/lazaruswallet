'use client';

export default function HeartbeatDisplay({ lastSeen, threshold }: { lastSeen: Date, threshold: number }) {
  const daysPassed = Math.floor((new Date().getTime() - lastSeen.getTime()) / (1000 * 3600 * 24));
  const daysLeft = threshold - daysPassed;
  
  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 bg-[#00A36C] rounded-full animate-pulse"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A36C]">Lazarus Protocol Active</span>
      </div>
      <div className="flex flex-col">
        <span className="text-5xl font-black tracking-tighter">{daysLeft > 0 ? daysLeft : 0}</span>
        <span className="text-[10px] font-bold uppercase text-gray-400">Days until reallocation</span>
      </div>
    </div>
  );
}