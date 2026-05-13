import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const styleBase = `
<style>
  @page { margin: 24px; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; }
  .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #CCFF00; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
  .meta { font-size: 11px; color: #666; }
  h1 { font-size: 18px; margin: 0 0 8px 0; letter-spacing: 1px; }
  h2 { font-size: 14px; margin-top: 18px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f5f5f5; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
  .b-green { background: #e8ffd6; color: #2d6e00; }
  .b-red { background: #ffe0e0; color: #b00020; }
  .b-orange { background: #fff0d6; color: #b96c00; }
  .stat { display: inline-block; margin-right: 24px; font-size: 12px; }
  .stat b { font-size: 18px; display: block; color: #000; }
  .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
</style>
`;

function header(title: string) {
  const now = new Date().toLocaleString('id-ID');
  return `
  <div class="head">
    <div><div class="brand">SSB ACADEMY</div><div class="meta">Dicetak: ${now}</div></div>
    <div style="text-align:right"><h1>${title}</h1></div>
  </div>`;
}

function footer() {
  return `<div class="footer">© SSB Academy — Sistem Manajemen Sekolah Sepak Bola</div>`;
}

export async function exportPDF(htmlBody: string, fileTitle: string) {
  const html = `<!doctype html><html><head>${styleBase}</head><body>${htmlBody}${footer()}</body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === 'web') {
    // open in new tab
    window.open(uri, '_blank');
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileTitle, UTI: 'com.adobe.pdf' });
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const statusLabel: Record<string, { label: string; cls: string }> = {
  present: { label: 'HADIR', cls: 'b-green' },
  sick: { label: 'SAKIT', cls: 'b-orange' },
  absent: { label: 'ABSEN', cls: 'b-red' },
};

export async function exportAttendanceReport(session: any, students: any[], attendance: any[]) {
  const statMap: Record<string, string> = {};
  attendance.forEach((a) => { statMap[a.student_id] = a.status; });
  const present = attendance.filter((a) => a.status === 'present').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const sick = attendance.filter((a) => a.status === 'sick').length;
  const rows = students
    .map((s) => {
      const st = statMap[s.id];
      const sl = st ? statusLabel[st] : { label: '-', cls: '' };
      return `<tr><td>${s.name}</td><td>${s.position}</td><td>#${s.jersey_number ?? '-'}</td><td><span class="badge ${sl.cls}">${sl.label}</span></td></tr>`;
    })
    .join('');
  const body = `
    ${header('LAPORAN ABSENSI')}
    <h2>${session.title}</h2>
    <div class="meta">${session.date} • ${session.time} • ${session.location}</div>
    <div style="margin-top:12px">
      <div class="stat"><b>${present}</b>Hadir</div>
      <div class="stat"><b>${sick}</b>Sakit</div>
      <div class="stat"><b>${absent}</b>Absen</div>
      <div class="stat"><b>${students.length}</b>Total</div>
    </div>
    <table><thead><tr><th>Nama</th><th>Posisi</th><th>No</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  await exportPDF(body, `Absensi-${session.date}.pdf`);
}

export async function exportProgressReport(student: any, ratings: any[], attendance: any[]) {
  const latest = ratings[0];
  const totalAtt = attendance.length;
  const presentRate = totalAtt > 0 ? Math.round((attendance.filter((a) => a.status === 'present').length / totalAtt) * 100) : 0;
  const ratingsRows = ratings
    .slice(0, 10)
    .map((r) => `
      <tr>
        <td>${new Date(r.rated_at).toLocaleDateString('id-ID')}</td>
        <td>${r.teknik}</td><td>${r.fisik}</td><td>${r.mental}</td><td>${r.taktik}</td><td>${r.kerjasama}</td>
        <td>${r.notes || '-'}</td>
      </tr>`)
    .join('');
  const body = `
    ${header('LAPORAN PERKEMBANGAN SISWA')}
    <h2>${student.name} — #${student.jersey_number ?? '-'} ${student.position}</h2>
    <div class="meta">Lahir: ${student.dob} • Bergabung: ${new Date(student.joined_at).toLocaleDateString('id-ID')}</div>
    <div style="margin-top:12px">
      <div class="stat"><b>${presentRate}%</b>Kehadiran</div>
      <div class="stat"><b>${ratings.length}</b>Evaluasi</div>
      <div class="stat"><b>${totalAtt}</b>Total Sesi</div>
    </div>
    ${latest ? `<h2>Rating Terakhir (${new Date(latest.rated_at).toLocaleDateString('id-ID')})</h2>
    <table><thead><tr><th>Teknik</th><th>Fisik</th><th>Mental</th><th>Taktik</th><th>Kerjasama</th></tr></thead>
    <tbody><tr><td>${latest.teknik}/10</td><td>${latest.fisik}/10</td><td>${latest.mental}/10</td><td>${latest.taktik}/10</td><td>${latest.kerjasama}/10</td></tr></tbody></table>` : ''}
    <h2>Riwayat Evaluasi</h2>
    <table><thead><tr><th>Tanggal</th><th>Tek</th><th>Fis</th><th>Men</th><th>Tak</th><th>Krj</th><th>Catatan</th></tr></thead>
    <tbody>${ratingsRows || '<tr><td colspan="7">Belum ada evaluasi</td></tr>'}</tbody></table>
  `;
  await exportPDF(body, `Perkembangan-${student.name}.pdf`);
}

export async function exportPaymentReport(payments: any[], students: any[], filterMonth?: number, filterYear?: number) {
  const studentName = (id: string) => students.find((s) => s.id === id)?.name || '-';
  const filtered = payments.filter((p) =>
    (filterMonth ? p.month === filterMonth : true) && (filterYear ? p.year === filterYear : true)
  );
  const paid = filtered.filter((p) => p.status === 'paid');
  const unpaid = filtered.filter((p) => p.status === 'unpaid');
  const totalPaid = paid.reduce((a, b) => a + (b.amount || 0), 0);
  const totalUnpaid = unpaid.reduce((a, b) => a + (b.amount || 0), 0);
  const rows = filtered
    .sort((a, b) => (b.year - a.year) || (b.month - a.month))
    .map((p) => `
      <tr>
        <td>${studentName(p.student_id)}</td>
        <td>${MONTHS[p.month - 1]} ${p.year}</td>
        <td>Rp ${p.amount.toLocaleString('id-ID')}</td>
        <td><span class="badge ${p.status === 'paid' ? 'b-green' : 'b-red'}">${p.status === 'paid' ? 'LUNAS' : 'BELUM'}</span></td>
        <td>${p.paid_date ? new Date(p.paid_date).toLocaleDateString('id-ID') : '-'}</td>
      </tr>`)
    .join('');
  const title = filterMonth ? `LAPORAN SPP ${MONTHS[filterMonth - 1]} ${filterYear}` : 'LAPORAN SPP';
  const body = `
    ${header(title)}
    <div style="margin-top:12px">
      <div class="stat"><b>${paid.length}</b>Lunas</div>
      <div class="stat"><b>${unpaid.length}</b>Belum Lunas</div>
      <div class="stat"><b>Rp ${totalPaid.toLocaleString('id-ID')}</b>Total Diterima</div>
      <div class="stat"><b>Rp ${totalUnpaid.toLocaleString('id-ID')}</b>Total Tertunggak</div>
    </div>
    <table><thead><tr><th>Siswa</th><th>Periode</th><th>Jumlah</th><th>Status</th><th>Tgl Bayar</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Tidak ada data</td></tr>'}</tbody></table>
  `;
  await exportPDF(body, `SPP-${filterYear || 'all'}.pdf`);
}
