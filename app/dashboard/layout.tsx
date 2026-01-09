export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-screen h-screen bg-black text-white flex flex-col">
      {children}
    </section>
  );
}
