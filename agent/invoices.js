const fs = require("fs");
const path = require("path");

const INVOICE_FILE = path.join(__dirname, "../data/invoices.json");

function ensureFile() {
  const dir = path.dirname(INVOICE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(INVOICE_FILE)) fs.writeFileSync(INVOICE_FILE, JSON.stringify({ invoices: [] }, null, 2));
}

function getData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(INVOICE_FILE));
}

function saveData(data) {
  fs.writeFileSync(INVOICE_FILE, JSON.stringify(data, null, 2));
}

function createInvoice(from, to, amount, description, dueDate) {
  const data = getData();
  const invoice = {
    id: "INV-" + Date.now(),
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    amount: parseFloat(amount),
    description,
    dueDate: dueDate || null,
    status: "pending",
    createdAt: new Date().toISOString(),
    paidAt: null,
    txHash: null
  };
  data.invoices.unshift(invoice);
  saveData(data);
  return invoice;
}

function payInvoice(invoiceId, txHash) {
  const data = getData();
  const inv = data.invoices.find(i => i.id === invoiceId);
  if (!inv) return { success: false, error: "Invoice not found" };
  if (inv.status === "paid") return { success: false, error: "Already paid" };
  inv.status = "paid";
  inv.paidAt = new Date().toISOString();
  inv.txHash = txHash || null;
  saveData(data);
  return { success: true, invoice: inv };
}

function cancelInvoice(invoiceId) {
  const data = getData();
  const inv = data.invoices.find(i => i.id === invoiceId);
  if (!inv) return { success: false, error: "Invoice not found" };
  inv.status = "cancelled";
  saveData(data);
  return { success: true };
}

function getInvoices(address) {
  const data = getData();
  if (!address) return data.invoices;
  const addr = address.toLowerCase();
  return data.invoices.filter(i => i.from === addr || i.to === addr);
}

function getInvoice(id) {
  const data = getData();
  return data.invoices.find(i => i.id === id) || null;
}

function getStats() {
  const data = getData();
  const total = data.invoices.length;
  const paid = data.invoices.filter(i => i.status === "paid").length;
  const pending = data.invoices.filter(i => i.status === "pending").length;
  const totalValue = data.invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  return { total, paid, pending, totalValue };
}

module.exports = { createInvoice, payInvoice, cancelInvoice, getInvoices, getInvoice, getStats };
