const fs = require('fs');
const path = require('path');

function run() {
  console.log('⚡ [Self-Healing] Injecting PO Printing & History to ProcurementPage.jsx...');
  const pagePath = path.resolve(__dirname, '../../frontend/src/pages/ProcurementPage.jsx');

  if (!fs.existsSync(pagePath)) {
    console.error('❌ ProcurementPage.jsx not found at path:', pagePath);
    return;
  }

  let content = fs.readFileSync(pagePath, 'utf8');

  // 1. Inject Printer Button next to RECEIVE Button
  console.log('📌 1. Injecting Printer button next to RECEIVE...');
  
  const targetButton = `                    <div className="pt-5 border-t border-border flex items-center justify-between">
                       <div className="data-mono font-black text-lg text-foreground tabular-nums tracking-tighter">{formatCurrency(po.total_amount)}</div>
                       <Button size="sm" onClick={() => handleReceivePO(po)} disabled={actionLoading}>
                         {actionLoading ? <Loader2 className="animate-spin" /> : "RECEIVE"}
                       </Button>
                    </div>`;

  const normalizedTarget = targetButton.replace(/\r\n/g, '\n').trim();

  // Find index of RECEIVE button block in a flexible way
  let targetIndex = content.indexOf('onClick={() => handleReceivePO(po)}');
  if (targetIndex === -1) {
    console.error('❌ Could not find RECEIVE button block by index!');
    return;
  }

  // Let's locate the enclosing `<div className="pt-5` before this click handler
  const startDiv = content.lastIndexOf('<div className="pt-5', targetIndex);
  const endDiv = content.indexOf('</div>', targetIndex) + 6; // Enclosing div close

  if (startDiv === -1 || endDiv === -1) {
    console.error('❌ Could not locate the exact button row bounds!');
    return;
  }

  const originalRow = content.substring(startDiv, endDiv);
  console.log('✅ Found original button row:', originalRow);

  const replacementRow = `<div className="pt-5 border-t border-border flex items-center justify-between">
                       <div className="data-mono font-black text-lg text-foreground tabular-nums tracking-tighter">{formatCurrency(po.total_amount)}</div>
                       <div className="flex gap-2">
                         <Button 
                           type="button" 
                           variant="outline" 
                           size="sm" 
                           className="h-9 px-3 border-amber-500/20 text-amber-600 hover:bg-amber-500/10 rounded-xl"
                           onClick={() => handlePrintPO(po)}
                         >
                           <Printer size={14} />
                         </Button>
                         <Button size="sm" onClick={() => handleReceivePO(po)} disabled={actionLoading}>
                           {actionLoading ? <Loader2 className="animate-spin" /> : "RECEIVE"}
                         </Button>
                       </div>
                    </div>`;

  content = content.replace(originalRow, replacementRow);
  console.log('✅ Button row successfully replaced!');

  // 2. Inject Historical Orders Ledger right before the close of grn tab
  console.log('📌 2. Injecting Historical Orders Ledger at the bottom of the grn tab...');
  
  // Find where the grn loop ends: we can find the `pendingPOs.filter` block and map close
  const grnClose = content.indexOf('</div>\n        )}', startDiv); // This will find the closing tag of grn tab: </div> \n )}
  // Or let's look for the end of the cards mapping: `// grn loop end`
  
  // Let's find: `              {pendingPOs.filter` and search for the closing `</div>` of the grid.
  const gridStart = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in', startDiv - 1000);
  const gridEnd = content.indexOf('</div>', startDiv + 300); // The next </div> after the cards mapping
  
  // Let's search for the outer </div> closing the tab:
  const grnTabEndIndex = content.indexOf('        )}', gridEnd);
  
  if (grnTabEndIndex === -1) {
    console.error('❌ Could not find closing boundary of grn tab!');
    return;
  }

  const grnTabCloseString = content.substring(gridEnd, grnTabEndIndex);
  console.log('✅ Found grn tab close boundary block!');

  const historyLedgerHtml = `
            {/* 💡 Historical Orders Ledger (Printable PDF Archive) */}
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground text-zinc-900 dark:text-white">Purchase Order History</h3>
                  <p className="text-xs text-muted-foreground font-bold">Historical archive of all requisitions and procurement logs</p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={10} /> Audit Trial Intact
                </div>
              </div>

              <Card className="border-none shadow-2xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Reference</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-center">Order Date</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Control</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPOs.filter(p => p.status !== 'pending' && p.status !== 'partially_received').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No historical orders found.</TableCell>
                        </TableRow>
                      )}
                      {pendingPOs.filter(p => p.status !== 'pending' && p.status !== 'partially_received').map(po => (
                        <TableRow key={po.id} className="h-16">
                          <TableCell className="data-mono text-muted-foreground font-bold">
                            {po.po_number || \`PO-\${po.id.toString().slice(0,6).toUpperCase()}\`}
                          </TableCell>
                          <TableCell className="font-black text-sm">{po.supplier?.name}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-muted-foreground">
                            {new Date(po.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right data-mono font-black text-foreground tabular-nums text-sm">
                            {formatCurrency(po.total_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "inline-flex items-center px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border",
                              po.status === 'completed' || po.status === 'Diterima'
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            )}>
                              {po.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 border-amber-500/20 text-amber-600 hover:bg-amber-500/10 rounded-xl"
                              onClick={() => handlePrintPO(po)}
                            >
                              <Printer size={12} className="mr-1.5" /> PDF / Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
`;

  // Insert the history ledger right before the close boundary
  const updatedGrnTabCloseString = grnTabCloseString + historyLedgerHtml;
  content = content.replace(grnTabCloseString, updatedGrnTabCloseString);
  console.log('✅ Historical ledger successfully injected!');

  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('🎉 [Self-Healing Complete] ProcurementPage.jsx modified successfully!');
}

run();
