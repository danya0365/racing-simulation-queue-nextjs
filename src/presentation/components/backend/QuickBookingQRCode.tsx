import { QRCodeSVG } from 'qrcode.react';
import React from 'react';

interface QuickBookingQRCodeProps {
  url: string;
}

export const QuickBookingQRCode = React.forwardRef<HTMLDivElement, QuickBookingQRCodeProps>(
  ({ url }, ref) => {
    return (
      <div ref={ref} className="print-content w-full h-full flex flex-col items-center justify-center bg-white p-8">
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 0mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          `}
        </style>
        <div className="flex flex-col items-center justify-center border-8 border-black p-12 rounded-3xl">
          <h1 className="text-5xl font-bold mb-12 text-black text-center">สแกนเพื่อจองคิว</h1>
          <div className="bg-white p-4">
            <QRCodeSVG value={url} size={500} level="H" />
          </div>
          <p className="mt-8 text-2xl text-black font-semibold">{url}</p>
        </div>
        <div className="mt-16 text-center">
          <p className="text-3xl text-gray-600 font-bold">Racing Simulation</p>
          <p className="text-xl text-gray-400 mt-2">Queue System</p>
        </div>
      </div>
    );
  }
);

QuickBookingQRCode.displayName = 'QuickBookingQRCode';
