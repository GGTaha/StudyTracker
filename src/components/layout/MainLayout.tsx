import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 flex overflow-hidden relative font-sans selection:bg-sky-500/30">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-900 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 z-0 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-sky-900 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 z-0 pointer-events-none"></div>
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto z-10 w-full">
        <Outlet />
      </main>
    </div>
  )
}
