
document.addEventListener('DOMContentLoaded', () => {
  const getCellValue = (row, columnName) => {
    const cell = row.querySelector(`[data-column="${columnName}"]`) || row.children[{
      'label': 0,
      'description': 1,
      'date': 2,
    }[columnName]];

    if (columnName === 'label') {
      // columnNameが'label'の場合、ラベルの言語に応じてlocaleを選択
      const labelValue = cell ? cell.textContent || cell.innerText : '';
      return labelValue.trim().match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/) ? 'ja' : 'en';
    }


    return cell ? cell.textContent || cell.innerText : '';
  };


  const compare = (a, b, columnName, order) => {
    const aValue = getCellValue(a, columnName);
    const bValue = getCellValue(b, columnName);
    const locale = columnName === 'label' ? 'ja' : 'en';
    const compareResult = aValue.localeCompare(bValue,locale, { numeric: true, sensitivity: 'variant' });
    return order === 'asc' ? compareResult : -compareResult;
  };

  

  const sortTable = (table, columnName, order) => {
    const rows = Array.from(table.tBodies[0].rows);
    rows.sort((a, b) => compare(a, b, columnName, order));
    rows.forEach(row => table.tBodies[0].appendChild(row));
  };

  const sortTableFromButton = (event) => {
    const button = event.target;
    const columnName = button.dataset.column;
    const table = document.querySelector('#detail-table-pc');
    const order = button.dataset.order === 'asc' ? 'desc' : 'asc';
    button.dataset.order = order;
    sortTable(table, columnName, order);
  };

  const buttons = document.querySelectorAll('#button-container button.sort-button');
  buttons.forEach(button => button.addEventListener('click', sortTableFromButton));
});