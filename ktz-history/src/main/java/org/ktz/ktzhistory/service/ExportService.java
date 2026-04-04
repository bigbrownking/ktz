package org.ktz.ktzhistory.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzhistory.model.TelemetryRecord;
import org.ktz.ktzhistory.repository.TelemetryRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TelemetryRepository repository;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")
                    .withZone(ZoneId.of("Asia/Almaty"));

    // ── CSV ──────────────────────────────────────────────────────

    public byte[] exportCsv(String locomotiveNumber) {
        List<TelemetryRecord> records = locomotiveNumber != null
                ? repository.findByLocomotiveNumber(locomotiveNumber)
                : repository.findAll();
        return buildCsv(records);
    }

    private byte[] buildCsv(List<TelemetryRecord> records) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (CSVWriter writer = new CSVWriter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8))) {

            writer.writeNext(new String[]{
                    "Время", "Локомотив", "Название", "Тип",
                    "Скорость (км/ч)", "Тяга (кН)", "Напряжение (В)", "Ток (А)",
                    "Об/мин", "Темп охл. (°C)", "Темп масла (°C)",
                    "Давл. масла (бар)", "Давл. турбины (бар)",
                    "Топливо (%)", "Вода (%)",
                    "Напр. секции (кВ)", "Рекуперация (кВт)"
            });

            for (TelemetryRecord r : records) {
                writer.writeNext(new String[]{
                        r.getTimestamp() != null ? FMT.format(r.getTimestamp()) : "",
                        r.getLocomotiveNumber(),
                        r.getLocomotiveName(),
                        r.getType() != null ? r.getType().name() : "",
                        fmt(r.getSpeed()),
                        fmt(r.getTractionForce()),
                        fmt(r.getVoltage()),
                        fmt(r.getCurrent()),
                        fmt(r.getEngineRpm()),
                        fmt(r.getCoolantTemp()),
                        fmt(r.getOilTemp()),
                        fmt(r.getOilPressure()),
                        fmt(r.getTurboPressure()),
                        fmt(r.getFuelLevel()),
                        fmt(r.getWaterLevel()),
                        fmt(r.getSectionVoltage()),
                        fmt(r.getPowerRecuperation())
                });
            }
        } catch (Exception e) {
            log.error("CSV export error: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка генерации CSV", e);
        }
        return out.toByteArray();
    }

    // ── PDF ──────────────────────────────────────────────────────

    public byte[] exportPdf(String locomotiveNumber) {
        List<TelemetryRecord> records = locomotiveNumber != null
                ? repository.findByLocomotiveNumber(locomotiveNumber)
                : repository.findAll();
        return buildPdf(records, locomotiveNumber);
    }

    private byte[] buildPdf(List<TelemetryRecord> records, String locomotiveNumber) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer  = new PdfWriter(out);
            PdfDocument pdf   = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Заголовок
            String title = locomotiveNumber != null
                    ? "Отчёт по локомотиву: " + locomotiveNumber
                    : "Отчёт по всем локомотивам";
            document.add(new Paragraph(title)
                    .setBold().setFontSize(16).setMarginBottom(8));
            document.add(new Paragraph("Записей: " + records.size()
                    + "  |  Сформирован: " + FMT.format(java.time.Instant.now()))
                    .setFontSize(9).setFontColor(ColorConstants.GRAY).setMarginBottom(16));

            if (records.isEmpty()) {
                document.add(new Paragraph("Нет данных").setFontSize(11));
                document.close();
                return out.toByteArray();
            }

            // Таблица
            float[] colWidths = {14, 10, 8, 8, 8, 9, 8, 8, 8, 8, 8, 8, 9};
            Table table = new Table(UnitValue.createPercentArray(colWidths))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setFontSize(7);

            String[] headers = {
                    "Время", "Локомотив", "Тип", "Скорость", "Тяга",
                    "Напряж.", "Ток", "Об/мин", "Темп охл.", "Давл. масла",
                    "Топливо%", "Вода%", "Рекуп."
            };
            for (String h : headers) {
                table.addHeaderCell(new Cell()
                        .add(new Paragraph(h).setBold().setFontSize(7))
                        .setBackgroundColor(ColorConstants.LIGHT_GRAY));
            }

            for (TelemetryRecord r : records) {
                table.addCell(cell(r.getTimestamp() != null ? FMT.format(r.getTimestamp()) : ""));
                table.addCell(cell(r.getLocomotiveNumber()));
                table.addCell(cell(r.getType() != null ? r.getType().name() : ""));
                table.addCell(cell(fmt(r.getSpeed())));
                table.addCell(cell(fmt(r.getTractionForce())));
                table.addCell(cell(fmt(r.getVoltage())));
                table.addCell(cell(fmt(r.getCurrent())));
                table.addCell(cell(fmt(r.getEngineRpm())));
                table.addCell(cell(fmt(r.getCoolantTemp())));
                table.addCell(cell(fmt(r.getOilPressure())));
                table.addCell(cell(fmt(r.getFuelLevel())));
                table.addCell(cell(fmt(r.getWaterLevel())));
                table.addCell(cell(fmt(r.getPowerRecuperation())));
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            log.error("PDF export error: {}", e.getMessage(), e);
            throw new RuntimeException("Ошибка генерации PDF", e);
        }
        return out.toByteArray();
    }

    // ── Вспомогательные ──────────────────────────────────────────

    private Cell cell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "").setFontSize(7));
    }

    private String fmt(double v) {
        return String.format("%.2f", v);
    }
}