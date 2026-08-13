import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Helper to apply standard table borders and alignment to a row
 */
const styleDataRow = (row, colCount, isCentered = true) => {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = {
      top: { style: 'thin', color: { arg: 'FFBFBFBF' } },
      left: { style: 'thin', color: { arg: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { arg: 'FFBFBFBF' } },
      right: { style: 'thin', color: { arg: 'FFBFBFBF' } }
    };
    if (i > 1 && isCentered) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    }
  }
};

/**
 * Helper to style the master table header
 */
const styleHeaderRow = (row, colCount) => {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.font = { bold: true, color: { arg: 'FFFFFFFF' } }; // White text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FF002060' } }; // Very dark blue bg
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { arg: 'FF000000' } },
      left: { style: 'thin', color: { arg: 'FF555555' } },
      bottom: { style: 'medium', color: { arg: 'FF000000' } },
      right: { style: 'thin', color: { arg: 'FF555555' } }
    };
  }
};

export async function generateExcelReport(reportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UltraFlow Documentation System';
  workbook.created = new Date();

  // ==========================================
  // SHEET 1: PROJECT SUMMARY
  // ==========================================
  const summarySheet = workbook.addWorksheet('Project Summary');
  
  summarySheet.getCell('A1').value = 'ULTRAFLOW PROGRESS REPORT';
  summarySheet.getCell('A1').font = { size: 16, bold: true, color: { arg: 'FF004B87' } };
  
  summarySheet.getCell('A3').value = 'Project:';
  summarySheet.getCell('B3').value = reportData.projectName;
  summarySheet.getCell('A4').value = 'Reporting Date:';
  summarySheet.getCell('B4').value = reportData.date;
  summarySheet.getCell('A5').value = 'Overall Progress:';
  summarySheet.getCell('B5').value = reportData.overallProgress / 100;
  summarySheet.getCell('B5').numFmt = '0%';
  
  ['A3', 'A4', 'A5'].forEach(cell => summarySheet.getCell(cell).font = { bold: true });

  let currentRow = 7;

  if (reportData.commentary) {
    summarySheet.getCell(`A${currentRow}`).value = 'PROGRESS COMMENTARY';
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;
    summarySheet.getCell(`A${currentRow}`).value = reportData.commentary;
    summarySheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    summarySheet.mergeCells(`A${currentRow}:E${currentRow + 3}`);
    currentRow += 5;
  }

  if (reportData.scope === 'Project' && reportData.hierarchy.length > 0) {
    summarySheet.getCell(`A${currentRow}`).value = 'BUILDING SUMMARY';
    summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;
    
    const headerRow = summarySheet.getRow(currentRow);
    headerRow.values = ['Location', 'Progress'];
    
    for (let i = 1; i <= 2; i++) {
        headerRow.getCell(i).font = { bold: true, color: { arg: 'FFFFFFFF' } };
        headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FF002060' } };
    }
    currentRow++;

    reportData.hierarchy.forEach(bldg => {
      const row = summarySheet.getRow(currentRow);
      row.values = [bldg.name, bldg.progress / 100];
      row.getCell(2).numFmt = '0%';
      styleDataRow(row, 2);
      currentRow++;
    });
  }

  summarySheet.getColumn('A').width = 30;
  summarySheet.getColumn('B').width = 20;

  // ==========================================
  // SHEET 2+: DETAILED LOCATION SHEETS (GLOBAL MATRIX)
  // ==========================================
  
  reportData.hierarchy.forEach(building => {
    const sheetName = reportData.scope === 'Project' ? building.name.substring(0, 31) : 'Detailed Report';
    const detailSheet = workbook.addWorksheet(sheetName);
    
    let dRow = 1;
    detailSheet.getCell(`A${dRow}`).value = `${building.name.toUpperCase()} - MASTER PROGRESS MATRIX`;
    detailSheet.getCell(`A${dRow}`).font = { size: 16, bold: true, color: { arg: 'FF004B87' } };
    dRow += 3;

    // 1. EXTRACT ALL UNIQUE ACTIVITIES (Building, Level, Wing, AND Space)
    const allActsSet = new Set();
    building.activities?.forEach(a => allActsSet.add(a.name));
    building.levels?.forEach(l => {
      l.activities?.forEach(a => allActsSet.add(a.name));
      l.wings?.forEach(w => {
        w.activities?.forEach(a => allActsSet.add(a.name));
        w.spaces?.forEach(s => s.activities?.forEach(a => allActsSet.add(a.name)));
      });
    });
    
    const globalCols = Array.from(allActsSet).sort();
    const totalCols = 2 + globalCols.length; // Col A (Name), Col B (Overall), Col C+ (All Activities)

    // 2. DRAW THE MASTER HEADER
    const headerRow = detailSheet.getRow(dRow);
    headerRow.values = ['Hierarchy / Location', 'Overall Progress', ...globalCols];
    styleHeaderRow(headerRow, totalCols);
    headerRow.height = 30;
    
    // Freeze Panes: Lock the Header row and the first 2 columns!
    detailSheet.views = [{ state: 'frozen', xSplit: 2, ySplit: dRow }];
    dRow++;

    // 3. BUILDING BANNER ROW (Holds Building-Wide Activities)
    const bRow = detailSheet.getRow(dRow);
    const bRowData = [`BUILDING: ${building.name.toUpperCase()}`, building.progress / 100];
    globalCols.forEach(col => {
        const act = building.activities?.find(a => a.name === col);
        bRowData.push(act ? act.progress / 100 : '');
    });
    bRow.values = bRowData;
    styleDataRow(bRow, totalCols, true);
    bRow.height = 25;
    
    for(let i=1; i<=totalCols; i++) {
        const cell = bRow.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FF203764' }}; // Darkest Blue
        cell.font = { color: { arg: 'FFFFFFFF'}, bold: true, size: 12 };
        if(i > 1 && bRowData[i-1] !== '') cell.numFmt = '0%';
    }
    bRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    dRow++;

    // 4. TRAVERSE LEVELS
    building.levels?.forEach(level => {
      
      // LEVEL BANNER ROW (Holds Level-Wide Activities)
      const lRow = detailSheet.getRow(dRow);
      const lRowData = [`  LEVEL: ${level.name.toUpperCase()}`, level.progress / 100];
      globalCols.forEach(col => {
          const act = level.activities?.find(a => a.name === col);
          lRowData.push(act ? act.progress / 100 : '');
      });
      lRow.values = lRowData;
      styleDataRow(lRow, totalCols, true);
      lRow.height = 25;
      
      for(let i=1; i<=totalCols; i++) {
          const cell = lRow.getCell(i);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FF305496' }}; // Medium Dark Blue
          cell.font = { color: { arg: 'FFFFFFFF'}, bold: true, size: 12 };
          if(i > 1 && lRowData[i-1] !== '') cell.numFmt = '0%';
      }
      lRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      dRow++;

      // 5. TRAVERSE WINGS
      level.wings?.forEach(wing => {
        
        // WING BANNER ROW (Holds Wing-Wide Activities)
        const wRow = detailSheet.getRow(dRow);
        const wRowData = [`    WING: ${wing.name.toUpperCase()}`, wing.progress / 100];
        globalCols.forEach(col => {
            const act = wing.activities?.find(a => a.name === col);
            wRowData.push(act ? act.progress / 100 : '');
        });
        wRow.values = wRowData;
        styleDataRow(wRow, totalCols, true);
        wRow.height = 20;
        
        for(let i=1; i<=totalCols; i++) {
           const cell = wRow.getCell(i);
           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FFB4C6E7' }}; // Medium Light Blue
           cell.font = { bold: true, color: { arg: 'FF000000' } };
           if(i > 1 && wRowData[i-1] !== '') cell.numFmt = '0%';
        }
        wRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        dRow++;

        // 6. TRAVERSE SPACES (Rooms)
        wing.spaces?.forEach(space => {
          const sRow = detailSheet.getRow(dRow);
          const rowData = [`      ${space.name}`, space.progress / 100]; 
          
          globalCols.forEach(col => {
              const act = space.activities.find(a => a.name === col);
              rowData.push(act ? act.progress / 100 : ''); // Leave completely blank if N/A
          });
          
          sRow.values = rowData;
          styleDataRow(sRow, totalCols, true);
          sRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
          
          sRow.getCell(2).numFmt = '0%';
          sRow.getCell(2).font = { bold: true };

          for(let i = 3; i <= totalCols; i++) {
              const cell = sRow.getCell(i);
              if(rowData[i-1] !== '') {
                  cell.numFmt = '0%';
              } else {
                  // A very subtle off-white for genuinely blank cells
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { arg: 'FFF9F9F9' } };
              }
          }
          dRow++;
        });
      });
    });

    // Formatting column widths for the unified Master Matrix
    detailSheet.getColumn(1).width = 35; // Location Name
    detailSheet.getColumn(2).width = 18; // Overall Progress
    for(let i = 3; i <= totalCols; i++) {
        detailSheet.getColumn(i).width = 16; // Activity Columns
    }
  });

  // Generate and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const sanitizedName = reportData.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${sanitizedName}_${reportData.scope.toLowerCase()}_report_${reportData.date.replace(/\//g, '-')}.xlsx`;
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}