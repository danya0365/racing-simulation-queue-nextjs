import { BackendView } from "@/src/presentation/components/backend/BackendView";
import { createServerBackendPresenter } from "@/src/presentation/presenters/backend/BackendPresenterServerFactory";
import type { Metadata } from "next";
import Link from "next/link";

// Tell Next.js this is a dynamic page
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  const presenter = await createServerBackendPresenter();

  try {
    return presenter.generateMetadata();
  } catch (error) {
    console.error("Error generating metadata:", error);

    return {
      title: "แอดมิน | Racing Queue",
      description: "ระบบจัดการคิวและเครื่องเล่น Racing Simulator",
    };
  }
}

/**
 * Backend/Admin page - Server Component for SEO optimization
 */
export default async function BackendPage() {
  const presenter = await createServerBackendPresenter();

  try {
    const nowStr = new Date().toISOString();
    const viewModel = await presenter.getViewModel(nowStr);

    return <BackendView initialViewModel={viewModel} />;
  } catch (error) {
    console.error("Error fetching backend data:", error);

    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-muted mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-400 hover:to-pink-500 transition-all"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }
}
