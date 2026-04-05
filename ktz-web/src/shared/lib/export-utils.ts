import type { TelemetrySnapshot } from './telemetry-context';

function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function exportCSV(buffer: TelemetrySnapshot[], locoNumber: string): void {
  if (buffer.length === 0) return;
  const headers = ['Время', 'Скорость (км/ч)', 'Здоровье (%)', 'Температура (°C)', 'Давление масла (бар)', 'Напряжение (В)', 'Ток (А)', 'Обороты (об/мин)', 'Топливо (%)', 'Категория'];
  const rows = buffer.map(s => [
    formatTs(s.ts),
    s.speed.toFixed(1),
    s.health.toFixed(1),
    s.temperature.toFixed(1),
    s.oilPressure.toFixed(2),
    s.voltage.toFixed(0),
    s.current.toFixed(1),
    s.rpm.toFixed(0),
    s.fuelLevel.toFixed(1),
    s.healthCategory,
  ]);

  const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `telemetry_${locoNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(buffer: TelemetrySnapshot[], locoNumber: string): Promise<void> {
  if (buffer.length === 0) return;

  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const now = new Date().toLocaleString('ru-RU');
  const from = buffer.length > 0 ? formatTs(buffer[0].ts) : '—';
  const to = buffer.length > 0 ? formatTs(buffer[buffer.length - 1].ts) : '—';

  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 297, 210, 'F');

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Telemetry Report', 14, 14);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Locomotive: ${locoNumber}    Period: ${from} – ${to}    Generated: ${now}`, 14, 21);

  const avgSpeed = buffer.reduce((s, r) => s + r.speed, 0) / buffer.length;
  const avgHealth = buffer.reduce((s, r) => s + r.health, 0) / buffer.length;
  const maxSpeed = Math.max(...buffer.map(r => r.speed));
  const minHealth = Math.min(...buffer.map(r => r.health));

  const kpis = [
    `Avg Speed: ${avgSpeed.toFixed(1)} km/h`,
    `Max Speed: ${maxSpeed.toFixed(1)} km/h`,
    `Avg Health: ${avgHealth.toFixed(1)}%`,
    `Min Health: ${minHealth.toFixed(1)}%`,
    `Records: ${buffer.length}`,
  ];
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  kpis.forEach((k, i) => doc.text(k, 14 + i * 56, 28));

  const headers = ['Time', 'Speed', 'Health', 'Temp', 'Oil Bar', 'Voltage', 'Current', 'RPM', 'Fuel%', 'Status'];
  const colW = [22, 16, 16, 16, 16, 18, 18, 16, 14, 18];
  let x = 14;
  let y = 36;

  doc.setFillColor(30, 30, 30);
  doc.rect(12, y - 4, 273, 6, 'F');
  doc.setTextColor(6, 182, 212);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  headers.forEach((h, i) => { doc.text(h, x, y); x += colW[i]; });

  doc.setFont('helvetica', 'normal');
  const maxRows = Math.min(buffer.length, 55);
  const step = Math.max(1, Math.floor(buffer.length / maxRows));

  for (let i = 0; i < buffer.length && y < 200; i += step) {
    const s = buffer[i];
    y += 4.5;
    x = 14;
    const isOdd = Math.floor(i / step) % 2 === 0;
    if (isOdd) {
      doc.setFillColor(22, 22, 22);
      doc.rect(12, y - 3.5, 273, 4.5, 'F');
    }
    const healthBad = s.health < 60;
    doc.setTextColor(healthBad ? 239 : 226, healthBad ? 68 : 232, healthBad ? 68 : 240);
    const row = [
      formatTs(s.ts),
      s.speed.toFixed(1),
      s.health.toFixed(1) + '%',
      s.temperature.toFixed(0) + '°',
      s.oilPressure.toFixed(1),
      s.voltage.toFixed(0),
      s.current.toFixed(0),
      s.rpm.toFixed(0),
      s.fuelLevel.toFixed(0) + '%',
      s.healthCategory,
    ];
    row.forEach((v, j) => { doc.text(v, x, y); x += colW[j]; });
    doc.setTextColor(226, 232, 240);
  }

  doc.save(`telemetry_${locoNumber}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
