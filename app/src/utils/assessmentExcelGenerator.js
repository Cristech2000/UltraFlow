import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function generateAssessmentExcel(assessment, projectData, assessorName) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Site Assessment');

  // 1. Report Header Section
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'ULTRA POWER SYSTEMS LTD';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { arg: 'FF004B87' } };

  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = 'SITE ASSESSMENT REPORT';
  sheet.getCell('A2').font = { size: 14, bold: true };

  const metaData = [
    ['Project:', projectData?.name || 'Unknown Project'],
    ['Assessment Title:', assessment.title],
    ['Prepared By:', assessorName],
    ['Date:', assessment.date],
    ['Status:', assessment.status]
  ];

  let row = 4;
  metaData.forEach(data => {
    sheet.getCell(`A${row}`).value = data[0];
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = data[1];
    row++;
  });

  row += 2;

  // 2. Dynamic Matrix Header
  const headers = ['ROOM NO.', 'ROOM TYPE', ...assessment.selectedItems, 'OBSERVATIONS'];
  const headerRow = sheet.getRow(row);
  headerRow.values = headers;
  
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FF002060' } };
    cell.font = { bold: true, color: { arg: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    sheet.getColumn(colNumber).width = colNumber <= 2 ? 20 : 18; 
  });
  sheet.getColumn(headers.length).width = 40; // Wide observations column
  
  // Freeze Panes
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: row }];
  row++;

  // 3. Matrix Data
  if (assessment.selectedSpaces && assessment.selectedSpaces.length > 0) {
    assessment.selectedSpaces.forEach(space => {
      const spaceRow = sheet.getRow(row);
      const rowData = [space.name, space.type || 'N/A'];
      
      let combinedObservations = [];

      if (assessment.selectedItems && assessment.selectedItems.length > 0) {
        assessment.selectedItems.forEach(item => {
          const cellData = assessment.matrix?.[space.spaceId]?.[item];
          let status = cellData?.status || '-';
          if (status === 'Requires Rectification') status = 'R'; // Shorthand as per requirements
          rowData.push(status);

          if (cellData?.observation) {
            combinedObservations.push(`${item}: ${cellData.observation}`);
          }
        });
      }

      rowData.push(combinedObservations.join(' | '));
      spaceRow.values = rowData;

      spaceRow.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: colNumber <= 2 || colNumber === headers.length ? 'left' : 'center', vertical: 'middle', wrapText: true };
      });
      row++;
    });
  }

  row += 3;

  // 4. Status Key / Legend
  sheet.getCell(`A${row}`).value = 'STATUS KEY';
  sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;
  
  const legends = [
    ['OK', 'Existing installation acceptable'],
    ['Blocked', 'Route/provision inaccessible or blocked'],
    ['Pending', 'Installation/verification pending'],
    ['Missing', 'Required installation not provided'],
    ['R', 'Requires rectification'],
    ['N/A', 'Not applicable']
  ];

  legends.forEach(leg => {
    sheet.getCell(`A${row}`).value = leg[0];
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = leg[1];
    row++;
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Assessment_${assessment.title.replace(/\s+/g, '_')}_${assessment.date}.xlsx`;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}