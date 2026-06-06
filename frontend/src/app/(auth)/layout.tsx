export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#40E0D0] opacity-[0.07] rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#00CED1] opacity-[0.07] rounded-full blur-[150px]" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-[#20B2AA] opacity-[0.05] rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center shadow-lg shadow-[#40E0D0]/20">
              <span className="text-black font-black text-xl">M</span>
            </div>
          </div>
          <h1 className="text-3xl font-black gradient-text">MikMok</h1>
          <p className="text-sm text-muted-foreground mt-2">Short Videos. Big Impact.</p>
        </div>

        {children}
      </div>
    </div>
  );
}
