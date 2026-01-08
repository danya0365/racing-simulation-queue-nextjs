import { CustomerView } from "@/src/presentation/components/customer/CustomerView";
import { createServerCustomerPresenter } from "@/src/presentation/presenters/customer/CustomerPresenterServerFactory";
import type { Metadata } from "next";
import Link from "next/link";

// Tell Next.js this is a dynamic page
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Generate metadata for the page
 */
export async function generateMetadata(): Promise<Metadata> {
  const presenter = await createServerCustomerPresenter();

  try {
    return presenter.generateMetadata();
  } catch (error) {
    console.error("Error generating metadata:", error);

    return {
      title: "จองคิว Racing Simulator | Racing Queue",
      description: "จองคิวเครื่องเล่น Racing Simulator ง่ายๆ รวดเร็ว",
    };
  }
}

/**
 * Customer page - Server Component for SEO optimization
 */
export default async function CustomerPage() {
  const presenter = await createServerCustomerPresenter();

  try {
    const viewModel = await presenter.getViewModel();

    return <CustomerView initialViewModel={viewModel} />;
  } catch (error) {
    console.error("Error fetching customer data:", error);

    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-muted mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }
}
