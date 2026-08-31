/**
 * Export clients data to Excel/CSV format
 */
export function exportClientsToExcel(clients: any[], filename = "clients-export") {
  if (!clients || clients.length === 0) return;

  const headers = Object.keys(clients[0]);
  const csvRows = [
    headers.join(","),
    ...clients.map(client =>
      headers.map(h => {
        const val = client[h];
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
      }).join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
