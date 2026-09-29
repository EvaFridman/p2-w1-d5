import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Writable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_PATH = path.join(__dirname, '..', '..', 'fonts', 'DejaVuSans.ttf');

@Injectable()
export class PdfService {
  streamListingCard(stream: Writable, listing: any): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);
    doc.font(FONT_PATH);

    doc.fontSize(20).text(listing.title);
    doc.moveDown();
    doc.fontSize(12).text(`Цена: ${listing.price} ₽`);
    doc.text(`Площадь: ${listing.area} м²`);
    doc.text(`Район: ${listing.district ? listing.district.title : '—'}`);
    doc.text(`Адрес: ${listing.address}`);
    doc.text(`Агент: ${listing.agent ? listing.agent.name : '—'}`);

    if (listing.description) {
      doc.moveDown();
      doc.text(listing.description);
    }

    doc.end();
  }

  streamListingsBundle(stream: Writable, listings: any[]): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);
    doc.font(FONT_PATH);

    doc.fontSize(20).text('Подборка объявлений');
    doc.fontSize(12).text(`Всего объявлений: ${listings.length}`);
    doc.moveDown();

    listings.forEach((listing, index) => {
      doc.text(`${index + 1}. ${listing.title} — ${listing.price} ₽`);
    });

    listings.forEach((listing) => {
      doc.addPage();
      doc.fontSize(18).text(listing.title);
      doc.moveDown();
      doc.fontSize(12).text(`Цена: ${listing.price} ₽`);
      doc.text(`Площадь: ${listing.area} м²`);
      doc.text(`Район: ${listing.district ? listing.district.title : '—'}`);
      doc.text(`Адрес: ${listing.address}`);
    });

    doc.end();
  }
}
