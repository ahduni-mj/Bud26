
import * as XLSX from 'xlsx';
import { Goal, SubActivity, QuarterDetail } from '../types';

const getAmt = (q: QuarterDetail) => (q.rate || 0) * (q.quantity || 0);

const getFlattenedData = (goals: Goal[], schoolName: string, schoolCode: string, submittedBy: string, timestamp: string) => {
  const flattenedData: any[] = [];

  goals.forEach((goal, gIdx) => {
    goal.activities.forEach((activity, aIdx) => {
      activity.subActivities.forEach((sub, sIdx) => {
        const total = getAmt(sub.q1) + getAmt(sub.q2) + getAmt(sub.q3) + getAmt(sub.q4);
        const serialNo = `${gIdx + 1}.${String.fromCharCode(97 + aIdx).toUpperCase()}.${sIdx + 1}`;
        
        flattenedData.push({
          'School Code': schoolCode,
          'School / Activity / Function': schoolName,
          'Serial No': serialNo,
          'Goal': goal.name,
          'Strategy': activity.name,
          'Activity / Cost Head': sub.name,
          'Details / Description': sub.description,
          'Remarks': sub.remarks,
          'VC Review Remarks': sub.reviewComments,
          'Ledger Name': sub.ledgerName,
          'Ledger Code': sub.ledgerCode,
          'Unit': sub.unit,
          'Q1 Quantity': sub.q1.quantity,
          'Q1 Rate': sub.q1.rate,
          'Q1 Total (INR)': getAmt(sub.q1),
          'Q2 Quantity': sub.q2.quantity,
          'Q2 Rate': sub.q2.rate,
          'Q2 Total (INR)': getAmt(sub.q2),
          'Q3 Quantity': sub.q3.quantity,
          'Q3 Rate': sub.q3.rate,
          'Q3 Total (INR)': getAmt(sub.q3),
          'Q4 Quantity': sub.q4.quantity,
          'Q4 Rate': sub.q4.rate,
          'Q4 Total (INR)': getAmt(sub.q4),
          'Annual Total (INR)': total,
          'Submitted By': submittedBy,
          'Submission Timestamp': timestamp
        });
      });
    });
  });
  return flattenedData;
};

export const getExcelBlob = (goals: Goal[], schoolName: string, schoolCode: string, submittedBy: string, timestamp: string): Blob => {
  const data = getFlattenedData(goals, schoolName, schoolCode, submittedBy, timestamp);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Plan');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const exportToExcel = (goals: Goal[], schoolName: string, schoolCode: string, submittedBy: string, timestamp: string) => {
  const flattenedData = getFlattenedData(goals, schoolName, schoolCode, submittedBy, timestamp);
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Plan');
  
  const wscols = [
    { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 35 }, { wch: 30 }, 
    { wch: 35 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, 
    { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 12 }, { wch: 15 }, // Q1
    { wch: 10 }, { wch: 12 }, { wch: 15 }, // Q2
    { wch: 10 }, { wch: 12 }, { wch: 15 }, // Q3
    { wch: 10 }, { wch: 12 }, { wch: 15 }, // Q4
    { wch: 20 }, { wch: 20 }, { wch: 25 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Budget_Report_${schoolCode || 'N_A'}_${(schoolName || 'Budget').replace(/\s+/g, '_')}.xlsx`);
};

export const parseExcelFile = (file: File): Promise<{ goals: Goal[], schoolName?: string, schoolCode?: string, submittedBy?: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (jsonData.length === 0) {
          resolve({ goals: [] });
          return;
        }

        const firstRow = jsonData[0];
        const schoolName = firstRow['School / Activity / Function'] || firstRow['School / Activity / Function Name'];
        const schoolCode = firstRow['School Code'] || firstRow['# Code'];
        const submittedBy = firstRow['Submitted By'];

        const goalsMap: Record<string, Goal> = {};

        jsonData.forEach((row) => {
          const goalName = row['Goal'] || row['Goal Objective'] || 'General';
          const strategyName = row['Strategy'] || row['Activity Cluster'] || 'Standard';
          const subName = row['Activity / Cost Head'] || row['Line Item'] || 'Misc';
          
          if (!goalsMap[goalName]) {
            goalsMap[goalName] = { id: crypto.randomUUID(), name: goalName, activities: [] };
          }
          
          let activity = goalsMap[goalName].activities.find(a => a.name === strategyName);
          if (!activity) {
            activity = { id: crypto.randomUUID(), name: strategyName, subActivities: [] };
            goalsMap[goalName].activities.push(activity);
          }

          activity.subActivities.push({
            id: crypto.randomUUID(),
            name: subName,
            description: row['Details / Description'] || row['Description'] || '',
            remarks: row['Remarks'] || '',
            reviewComments: row['VC Review Remarks'] || row['Review Comments'] || '',
            ledgerName: row['Ledger Name'] || '',
            ledgerCode: row['Ledger Code'] || '',
            unit: row['Unit'] || '',
            q1: { 
              rate: Number(row['Q1 Rate']) || 0, 
              quantity: Number(row['Q1 Quantity']) || 0 
            },
            q2: { 
              rate: Number(row['Q2 Rate']) || 0, 
              quantity: Number(row['Q2 Quantity']) || 0 
            },
            q3: { 
              rate: Number(row['Q3 Rate']) || 0, 
              quantity: Number(row['Q3 Quantity']) || 0 
            },
            q4: { 
              rate: Number(row['Q4 Rate']) || 0, 
              quantity: Number(row['Q4 Quantity']) || 0 
            },
          });
        });

        resolve({ goals: Object.values(goalsMap), schoolName, schoolCode, submittedBy });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
