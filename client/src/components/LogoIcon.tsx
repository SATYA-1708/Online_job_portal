/** Shared TECHSPARKX logo icon — clean "TX" monogram */
export const LogoIcon = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const isSmall = size === 'sm';
    return (
        <div className={`${isSmall ? 'w-8 h-8 rounded-lg text-sm' : 'w-11 h-11 rounded-xl text-base'} bg-emerald-500 flex items-center justify-center font-black text-gray-950 tracking-tight shrink-0`}>
            TX
        </div>
    );
};
