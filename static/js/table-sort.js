document.addEventListener('DOMContentLoaded', () => {
  const getCellValue = (row, columnName) => {
    const cell = row.querySelector(`[data-column="${columnName}"]`) || row.children[{
      'label': 0,
      'description': 1,
      'date': 2,
    }[columnName]];
    return cell ? cell.textContent || cell.innerText : '';
  };

  const compare = (a, b, columnName, order) => {
    const aValue = getCellValue(a, columnName);
    const bValue = getCellValue(b, columnName);
    const compareResult = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
    return order === 'asc' ? compareResult : -compareResult;
  };

  const sortTable = (table, columnName, order) => {
    const rows = Array.from(table.tBodies[0].rows);
    rows.sort((a, b) => compare(a, b, columnName, order));
    rows.forEach(row => table.tBodies[0].appendChild(row));
  };

  const handleHeaderClick = (event) => {
    const header = event.target;
    const columnName = header.dataset.column;
    const table = header.closest('table');
    const order = header.dataset.order === 'asc' ? 'desc' : 'asc';
    header.dataset.order = order;
    sortTable(table, columnName, order);
  };

  const headers = document.querySelectorAll('#detail-table-pc th');
  headers.forEach(header => header.addEventListener('click', handleHeaderClick));
});
