'use client';

export default function SimulationTopBar({
  selectedDesignName,
}: {
  selectedDesignName: string | null;
}) {
  if (!selectedDesignName) return null;

  return (
    <div className="h-12 border-b bg-white flex items-center justify-between px-4">
        <span className="
        h-8 px-3 text-xs rounded-md
        bg-green-500/20 text-green-700 border border-green-200
        font-medium inline-flex items-center justify-center
        transition-all duration-200
        ">
            {selectedDesignName}
        </span>
      <div />
    </div>
  );
}