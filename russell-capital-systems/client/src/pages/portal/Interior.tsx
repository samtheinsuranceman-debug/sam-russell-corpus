import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileText, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";

/* The interior design system, shown against real Russell Capital content.
   Every control on this page is the shared primitive — nothing here is a
   one-off. Change it here and all 232 portal screens change with it. */

const CARRIERS = [
  { name: "Mass Mutual",        rating: "A++", cap: "11.00%", floor: "0.00%", guar: "2.00%", illus: "6.21%", state: "act"  },
  { name: "New York Life",      rating: "A++", cap: "10.25%", floor: "0.00%", guar: "2.00%", illus: "5.94%", state: "act"  },
  { name: "Penn Mutual",        rating: "A+",  cap: "12.50%", floor: "0.00%", guar: "1.00%", illus: "6.48%", state: "act"  },
  { name: "Guardian Life",      rating: "A++", cap: "9.75%",  floor: "0.00%", guar: "2.00%", illus: "5.71%", state: "warn" },
  { name: "Northwestern Mutual",rating: "A++", cap: "10.00%", floor: "0.00%", guar: "2.00%", illus: "5.83%", state: "act"  },
];

export default function Interior() {
  const [tone, setTone] = useState("conservative");

  return (
    <AppShell>
      <div className="in-scope" style={{ padding: "24px 24px 72px", maxWidth: 1180, margin: "0 auto" }}>

        <div className="in-pagehead">
          <div>
            <span className="in-eyebrow">Design system · interior</span>
            <h1>Controls</h1>
            <p>
              Every button, field, tab, panel and table behind the sign-in, in one place.
              These are the shared primitives — edit them here and the whole portal follows.
            </p>
          </div>
          <div className="in-btn-row">
            <Button className="in-btn-quiet"><RefreshCw /> Reset</Button>
            <Button className="in-btn-primary"><Plus /> New illustration</Button>
          </div>
        </div>

        {/* ── Buttons ────────────────────────────────────────────────── */}
        <Card className="in-raised" style={{ marginBottom: 20 }}>
          <CardHeader><CardTitle>Buttons</CardTitle></CardHeader>
          <CardContent style={{ display: "grid", gap: 18 }}>
            <Row label="Primary — the one action this screen exists to perform">
              <Button className="in-btn-primary">Run projection</Button>
              <Button className="in-btn-primary" size="sm">Run</Button>
              <Button className="in-btn-primary" disabled>Disabled</Button>
            </Row>
            <Row label="Secondary — a real alternative, same weight class">
              <Button className="in-btn-secondary">Compare carriers</Button>
              <Button className="in-btn-secondary" size="sm">Compare</Button>
            </Row>
            <Row label="Quiet — navigation and anything reversible">
              <Button className="in-btn-quiet">Back to clients</Button>
              <Button className="in-btn-quiet" size="sm">Skip</Button>
            </Row>
            <Row label="Money — produces a number or a document the client keeps">
              <Button className="in-btn-money"><FileText /> Generate report</Button>
              <Button className="in-btn-money" size="sm"><Download /> Export PDF</Button>
            </Row>
            <Row label="Risk — destroys, cancels, or cannot be undone">
              <Button className="in-btn-risk"><Trash2 /> Delete scenario</Button>
            </Row>
            <Row label="Segmented — one choice from a small fixed set">
              <div className="in-seg">
                {["conservative", "moderate", "aggressive"].map(t => (
                  <button key={t} onClick={() => setTone(t)}
                          aria-pressed={tone === t}
                          style={{ textTransform: "capitalize" }}>{t}</button>
                ))}
              </div>
            </Row>
          </CardContent>
        </Card>

        {/* ── Figures + panels ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginBottom: 20 }}>
          <Card className="in-key">
            <CardContent style={{ paddingTop: 4 }}>
              <div className="in-figure">
                <span className="in-eyebrow">Guaranteed at age 65</span>
                <span className="in-figure-val is-guar">$84,120</span>
                <span className="in-figure-cap">Contractual. Does not depend on index performance.</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent style={{ paddingTop: 4 }}>
              <div className="in-figure">
                <span className="in-eyebrow">Illustrated at 6.21%</span>
                <span className="in-figure-val">$141,880</span>
                <span className="in-figure-cap">
                  <span className="in-figure-delta in-pos">+68.7%</span> over guaranteed. Not a promise.
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="in-inset">
            <CardContent style={{ paddingTop: 4 }}>
              <div className="in-figure">
                <span className="in-eyebrow">Erosion to taxes &amp; inflation</span>
                <span className="in-figure-val in-neg">−$39,410</span>
                <div className="in-meter is-warn" style={{ marginTop: 8 }}><span style={{ width: "44%" }} /></div>
                <span className="in-figure-cap">44% of nominal growth, 30-year window.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs, fields, chips ────────────────────────────────────── */}
        <Card style={{ marginBottom: 20 }}>
          <CardHeader><CardTitle>Tabs, fields and status</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="inputs">
              <TabsList>
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="inputs">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, paddingTop: 18 }}>
                  <div>
                    <label className="in-label" htmlFor="f-age">Current age</label>
                    <Input id="f-age" defaultValue="47" />
                  </div>
                  <div className="in-field-money">
                    <label className="in-label" htmlFor="f-prem">Annual premium</label>
                    <Input id="f-prem" defaultValue="24,000" />
                    <p className="in-help">Solved to the non-MEC maximum.</p>
                  </div>
                  <div>
                    <label className="in-label" htmlFor="f-start">Income start</label>
                    <Input id="f-start" defaultValue="Age 65" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 18 }}>
                  <span className="in-chip in-chip-gold"><Lock size={11} /> Guaranteed</span>
                  <span className="in-chip in-chip-act">Verified source</span>
                  <span className="in-chip in-chip-info">Illustrated</span>
                  <span className="in-chip in-chip-warn">Rate sheet 60+ days old</span>
                  <span className="in-chip in-chip-risk">Carrier withdrew product</span>
                  <span className="in-chip in-chip-mute">Draft</span>
                </div>
                <div style={{ display: "grid", gap: 10, paddingTop: 20, maxWidth: 380 }}>
                  <Meter label="Fact finder complete" pct={82} />
                  <Meter label="Compliance packet" pct={45} tone="is-warn" />
                  <Meter label="Suitability review" pct={18} tone="is-risk" />
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <p style={{ paddingTop: 18, color: "var(--in-mute)", maxWidth: "62ch", margin: 0 }}>
                  Tabs are an underline rail now, not cyan pills in an amber tray. The active tab
                  is the only coloured thing in the row, which is what makes it findable.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Carrier comparison</CardTitle></CardHeader>
          <CardContent style={{ overflowX: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>AM Best</TableHead>
                  <TableHead className="num">Cap</TableHead>
                  <TableHead className="num">Floor</TableHead>
                  <TableHead className="num">Guaranteed</TableHead>
                  <TableHead className="num">Illustrated</TableHead>
                  <TableHead>Rate sheet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CARRIERS.map(c => (
                  <TableRow key={c.name}>
                    <TableCell style={{ color: "var(--in-head)", fontWeight: 550 }}>{c.name}</TableCell>
                    <TableCell>{c.rating}</TableCell>
                    <TableCell className="num">{c.cap}</TableCell>
                    <TableCell className="num">{c.floor}</TableCell>
                    <TableCell className="num in-guar">{c.guar}</TableCell>
                    <TableCell className="num">{c.illus}</TableCell>
                    <TableCell>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <span className={`in-dot in-dot-${c.state}`} />
                        <span style={{ color: "var(--in-mute)", fontSize: 12.5 }}>
                          {c.state === "act" ? "Current" : "Check"}
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="in-eyebrow" style={{ marginBottom: 9 }}>{label}</div>
      <div className="in-btn-row">{children}</div>
    </div>
  );
}

function Meter({ label, pct, tone = "" }: { label: string; pct: number; tone?: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: "var(--in-body)" }}>{label}</span>
        <span style={{ fontSize: 12.5, color: "var(--in-mute)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
      </div>
      <div className={`in-meter ${tone}`}><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
