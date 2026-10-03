import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  FileText,
  Fingerprint,
  GitCompareArrows,
  Layers3,
  Search,
  Shuffle,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import leaderData from "./data/leaders.json";
import { publicAssetPath } from "./lib/urls";
import { indicators } from "./data/catalog";
import {
  categories,
  formatValue,
  formatYears,
  getComparison,
  getLeaderMetrics,
  getMetricBasisLabel,
} from "./lib/metrics";
import type {
  CategoryId,
  Indicator,
  Leader,
  LeaderMetrics,
  MetricBasis,
} from "./types";
import { Button, Input, Modal, Segmented, Select } from "./components/ui";

const leaders = leaderData.leaders as Leader[];
const defaultLeft =
  leaders.find((leader) => leader.ordinal === 23) || leaders[0];
const defaultRight =
  leaders.find((leader) => leader.ordinal === 27) || leaders[1];
const metricCache = new Map(
  leaders.map((leader) => [
    leader.id,
    getLeaderMetrics(leader, indicators, leaders),
  ]),
);
const eraNames = {
  foundation: "ยุควางรากฐาน",
  development: "ยุคพัฒนา",
  modern: "ยุคร่วมสมัย",
};
const year = (date: string) => String(Number(date.slice(0, 4)) + 543);
const yearRange = (leader: Leader) =>
  `${year(leader.terms[0].start)}–${leader.terms.at(-1)?.end ? year(leader.terms.at(-1)!.end!) : "ปัจจุบัน"}`;
const shortRange = (leader: Leader) =>
  `${leader.terms[0].start.slice(0, 4)} / ${leader.terms.at(-1)?.end?.slice(0, 4) || "NOW"}`;
const termOptions = (leader: Leader) => [
  { value: "all", label: "รวมทุกช่วงที่ดำรงตำแหน่ง" },
  ...leader.terms.map((term) => ({ value: term.id, label: term.label })),
];
const formatRaw = (value: number | null, indicator: Indicator) =>
  value === null ? "ไม่มีข้อมูล" : formatValue(value, indicator);
const number = (value: number | null) =>
  value === null ? "—" : Math.round(value).toString();

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <img src={publicAssetPath("/favicon.svg")} alt="" width="31" height="36" />
      <span>
        PMfolio<span className="brand-dot">.</span>
      </span>
    </span>
  );
}

function Portrait({
  leader,
  eager = false,
}: {
  leader: Leader;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [leader.portrait]);
  return (
    <div className="portrait">
      {leader.portrait && !failed ? (
        <img
          src={publicAssetPath(leader.portrait)}
          alt={leader.name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="portrait-placeholder">
          <Fingerprint size={76} strokeWidth={0.8} />
          <span>ARCHIVE / {String(leader.ordinal).padStart(2, "0")}</span>
        </div>
      )}
      <div className="portrait-grain" aria-hidden="true" />
    </div>
  );
}

function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={publicAssetPath(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="source-link"
    >
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}

function ScoreBars({
  metrics,
  compact = false,
}: {
  metrics: LeaderMetrics;
  compact?: boolean;
}) {
  const priority: CategoryId[] = [
    "economy",
    "trade",
    "health",
    "governance",
    "education",
    "equity",
    "infrastructure",
    "environment",
    "fiscal",
  ];
  const available = priority
    .map((id) => metrics.categories.find((category) => category.id === id)!)
    .filter((category) => category.score !== null);
  const shown = compact ? available.slice(0, 3) : metrics.categories;
  return (
    <div className={`score-bars ${compact ? "score-bars-compact" : ""}`}>
      {compact && !shown.length ? (
        <p className="score-empty">ยังไม่มีชุดสถิติที่ใช้คำนวณได้</p>
      ) : null}
      {shown.map((category) => (
        <div className={`score-row basis-${category.basis}`} key={category.id}>
          <span title={category.label}>
            {compact
              ? categories.find((item) => item.id === category.id)
                  ?.shortLabel || category.label
              : category.label}
            {!compact &&
            category.score !== null &&
            category.basis !== "tenure" ? (
              <small className="score-basis-label">
                {getMetricBasisLabel(category.basis)}
              </small>
            ) : null}
          </span>
          <div className="score-track" aria-hidden="true">
            {category.score !== null ? (
              <i style={{ width: `${category.score}%` }} />
            ) : (
              <i className="score-unavailable" />
            )}
          </div>
          <strong title={getMetricBasisLabel(category.basis)}>
            {number(category.score)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function BasisBadge({
  basis,
  mixed = false,
}: {
  basis: MetricBasis;
  mixed?: boolean;
}) {
  if (basis === "none") return null;
  const label =
    mixed && basis === "single-year"
      ? "บางด้านมีข้อมูลปีเดียว"
      : getMetricBasisLabel(basis);
  return <span className={`basis-badge basis-${basis}`}>{label}</span>;
}

function RosterCard({
  leader,
  selected,
  onSelect,
  onOpen,
  index,
}: {
  leader: Leader;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  index: number;
}) {
  const metrics = metricCache.get(leader.id)!;
  return (
    <article
      className={`roster-card ${selected ? "selected" : ""} reveal`}
      style={{ "--delay": `${Math.min(index % 4, 3) * 55}ms` } as CSSProperties}
    >
      <button
        className="portrait-button"
        onClick={onOpen}
        aria-label={`เปิดแฟ้ม ${leader.name}`}
      >
        <div className="card-number">
          {String(leader.ordinal).padStart(2, "0")}
          <span>PRIME MINISTER</span>
        </div>
        <Portrait leader={leader} />
        <span className="card-era">{eraNames[leader.era]}</span>
        <span className="portrait-open">
          <ArrowUpRight size={19} />
        </span>
      </button>
      <div className="card-content">
        <div className="card-period mono">
          {shortRange(leader)}
          <span>
            {leader.terms.length > 1
              ? `${leader.terms.length} ช่วงวาระ`
              : "1 ช่วงวาระ"}
          </span>
        </div>
        <button className="card-name" onClick={onOpen}>
          {leader.shortName}
        </button>
        <div className="card-english">{leader.englishName}</div>
        <ScoreBars metrics={metrics} compact />
        <div className="coverage-note">
          <span
            className={
              metrics.scoredCategoryCount ? "status-dot" : "status-dot muted"
            }
          />
          {metrics.scoredCategoryCount
            ? `มีดัชนี ${metrics.scoredCategoryCount}/9 ด้าน · แสดง ${Math.min(3, metrics.scoredCategoryCount)}`
            : "เปิดอ่านบันทึกประวัติศาสตร์"}
        </div>
        <div className="card-basis">
          <BasisBadge basis={metrics.basis} mixed />
        </div>
      </div>
      <div className="card-actions">
        <Button variant="quiet" onClick={onOpen}>
          เปิดแฟ้ม <ArrowRight size={15} />
        </Button>
        <Button
          variant={selected ? "lime" : "quiet"}
          className="card-vs"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${selected ? "นำออกจาก" : "เพิ่มใน"} VS: ${leader.name}`}
        >
          {selected ? <Check size={16} /> : <Swords size={15} />} VS
        </Button>
      </div>
    </article>
  );
}

function Radar({
  rows,
}: {
  rows: {
    id: CategoryId;
    label: string;
    leftScore: number | null;
    rightScore: number | null;
  }[];
}) {
  const radius = 110,
    center = 170;
  const position = (index: number, scale = 1) => {
    const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2;
    return [
      center + Math.cos(angle) * radius * scale,
      center + Math.sin(angle) * radius * scale,
    ];
  };
  const polygon = (scale: number) =>
    rows.map((_, index) => position(index, scale).join(",")).join(" ");
  const full =
    rows.length >= 3 &&
    rows.every((row) => row.leftScore !== null && row.rightScore !== null);
  return (
    <svg
      viewBox="0 0 340 340"
      className="radar"
      role="img"
      aria-label="กราฟเปรียบเทียบดัชนีผลลัพธ์ของสองวาระ จุดที่ไม่มีข้อมูลจะไม่ถูกวาด"
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={polygon(scale)}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
        />
      ))}
      {rows.map((row, index) => {
        const [x, y] = position(index);
        const [tx, ty] = position(index, 1.28);
        return (
          <g key={row.id}>
            <line
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.15"
            />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle">
              {row.label}
            </text>
          </g>
        );
      })}
      {(["leftScore", "rightScore"] as const).map((key, side) => (
        <g key={key} className={side === 0 ? "radar-left" : "radar-right"}>
          {full ? (
            <polygon
              points={rows
                .map((row, index) => position(index, row[key]! / 100).join(","))
                .join(" ")}
              strokeWidth="2"
            />
          ) : null}
          {rows.map((row, index) =>
            row[key] !== null ? (
              <circle
                key={row.id}
                cx={position(index, row[key]! / 100)[0]}
                cy={position(index, row[key]! / 100)[1]}
                r="4"
              >
                <title>
                  {row.label}: {Math.round(row[key]!)}
                </title>
              </circle>
            ) : null,
          )}
        </g>
      ))}
      <text
        x={center}
        y={center + 4}
        textAnchor="middle"
        className="radar-center"
      >
        VS
      </text>
    </svg>
  );
}

function Sparkline({
  indicator,
  values,
}: {
  indicator: Indicator;
  values: { year: number; value: number }[];
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values.map((item) => item.value)),
    max = Math.max(...values.map((item) => item.value));
  const x = (date: number) =>
    6 +
    ((date - values[0].year) /
      Math.max(1, values.at(-1)!.year - values[0].year)) *
      308;
  const y = (value: number) =>
    74 - ((value - min) / Math.max(0.001, max - min)) * 60;
  return (
    <svg
      viewBox="0 0 320 96"
      className="sparkline"
      role="img"
      aria-label={`${indicator.name} รายปี ${formatYears(values.map((item) => item.year))}`}
    >
      <path
        d={values
          .map(
            (item, index) =>
              `${index === 0 || item.year !== values[index - 1].year + 1 ? "M" : "L"}${x(item.year)},${y(item.value)}`,
          )
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {values.map((item) => (
        <circle key={item.year} cx={x(item.year)} cy={y(item.value)} r="3">
          <title>
            {item.year}: {formatRaw(item.value, indicator)}{" "}
            {indicator.unitLabel}
          </title>
        </circle>
      ))}
      <text x="6" y="94">
        {values[0].year}
      </text>
      <text x="314" y="94" textAnchor="end">
        {values.at(-1)!.year}
      </text>
    </svg>
  );
}

function Profile({
  leader,
  onClose,
  onCompare,
}: {
  leader: Leader | null;
  onClose: () => void;
  onCompare: (leader: Leader) => void;
}) {
  const [term, setTerm] = useState("all");
  useEffect(() => setTerm("all"), [leader?.id]);
  const metrics = useMemo(
    () =>
      leader
        ? getLeaderMetrics(
            leader,
            indicators,
            leaders,
            term === "all" ? undefined : term,
          )
        : null,
    [leader, term],
  );
  if (!leader || !metrics) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={leader.name}
      description={`${leader.englishName} · นายกรัฐมนตรีคนที่ ${leader.ordinal}`}
      wide
    >
      <div className="profile-intro">
        <div className="profile-portrait">
          <Portrait leader={leader} eager />
          <span className="mono">
            ARCHIVE NO. {String(leader.ordinal).padStart(2, "0")}
          </span>
        </div>
        <div>
          <span className="eyebrow">THE PUBLIC RECORD</span>
          <h3>{leader.shortName}</h3>
          <p className="profile-summary">{leader.summary}</p>
          <div className="profile-meta">
            <span>{yearRange(leader)}</span>
            <span>{eraNames[leader.era]}</span>
          </div>
          <Button variant="lime" onClick={() => onCompare(leader)}>
            <Swords size={17} /> เลือกคนนี้เข้า VS
          </Button>
        </div>
      </div>
      <div className="profile-toolbar">
        <div>
          <h3>
            {metrics.basis === "country-context"
              ? "บริบทประเทศในปีที่ดำรงตำแหน่ง"
              : "ดัชนีผลลัพธ์ช่วงวาระ"}
          </h3>
          <p>ตำแหน่งในชุดสถิติไทย 0–100 ดูตัวเลขจริงประกอบเสมอ</p>
          <BasisBadge basis={metrics.basis} mixed />
        </div>
        <Select
          label="เลือกช่วงวาระ"
          value={term}
          onChange={setTerm}
          options={termOptions(leader)}
        />
      </div>
      <div className="profile-stats">
        <ScoreBars metrics={metrics} />
        <aside>
          <CircleHelp size={20} />
          <strong>ผลลัพธ์มีบริบท</strong>
          <p>
            {metrics.basis === "country-context"
              ? "วาระนี้ไม่มีปีปฏิทินที่ดำรงตำแหน่งเกินครึ่งปี ตัวเลขที่แสดงเป็นภาพประเทศทั้งปีที่วาระนั้นคาบเกี่ยว ไม่ใช่ผลงานของนายกฯ ในช่วงสั้นนั้น"
              : "เศรษฐกิจโลก วิกฤต นโยบายที่สืบทอด และระยะเวลาที่ผลปรากฏ ล้วนมีส่วนต่อข้อมูลนี้ คะแนนจึงไม่ใช่ข้อพิสูจน์ฝีมือส่วนบุคคล"}
          </p>
          <span className="mono">
            {metrics.usedYears.length} ปีที่เข้าเกณฑ์ ·{" "}
            {formatYears(metrics.usedYears)}
          </span>
        </aside>
      </div>
      <h3 className="subheading">บันทึกสำคัญ</h3>
      <div className="highlights">
        {leader.highlights.map((item, i) => (
          <article key={i}>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
              <SourceLink href={item.sourceUrl}>อ่านหลักฐาน</SourceLink>
            </div>
          </article>
        ))}
      </div>
      <h3 className="subheading">ตัวเลขที่อยู่เบื้องหลัง</h3>
      <div className="metric-detail-grid">
        {metrics.metrics.map((metric) => (
          <article className="metric-detail" key={metric.indicator.id}>
            <span className="eyebrow">{metric.indicator.categoryLabel}</span>
            <h4>{metric.indicator.name}</h4>
            <strong className="raw-value">
              {formatRaw(metric.average, metric.indicator)}
            </strong>
            <p className="metric-unit">{metric.indicator.unitLabel}</p>
            <p>
              ค่าเฉลี่ย {metric.sampleCount} ปี ·{" "}
              {metric.years.length
                ? formatYears(metric.years)
                : "ไม่มีข้อมูลในช่วงนี้"}
            </p>
            <BasisBadge basis={metric.basis} />
            <Sparkline indicator={metric.indicator} values={metric.values} />
            <p className="metric-explanation">{metric.indicator.description}</p>
            {metric.benchmarkAverage !== null ? (
              <p className="metric-benchmark">
                ค่าเฉลี่ยโลกในปีเดียวกัน{" "}
                {formatRaw(metric.benchmarkAverage, metric.indicator)}{" "}
                {metric.indicator.unitLabel}
              </p>
            ) : null}
            {metric.indicator.uncertainty?.length ? (
              <p className="metric-reason">
                {metric.indicator.uncertaintyDescription ||
                  "ค่าประมาณจากต้นทางมีช่วงความไม่แน่นอน"}{" "}
                ช่วงความเชื่อมั่นรายปีอยู่ในไฟล์ตัวเลขรายปีที่ห้องหลักฐาน
              </p>
            ) : null}
            {metric.indicator.scorePriority !== undefined &&
            metric.indicator.scorePriority < 20 ? (
              <p className="metric-reason">
                ชุดข้อมูลเสริม/ย้อนหลัง มีนิยามและฐานอ้างอิงแยกจากชุดหลัก
                ดูรายละเอียดต้นทางก่อนเปรียบเทียบ
              </p>
            ) : null}
            {metric.score !== null && !metric.usedInCategory ? (
              <p className="metric-reason">
                แสดงเพื่ออ่านประกอบ ไม่คิดซ้ำในคะแนนรายด้าน
                เพราะมีชุดหลักของตัวชี้วัดกลุ่มเดียวกัน
              </p>
            ) : null}
            {metric.reason ? (
              <p className="metric-reason">{metric.reason}</p>
            ) : null}
            <SourceLink href={metric.indicator.source.url}>
              ข้อมูลต้นทาง
            </SourceLink>
          </article>
        ))}
      </div>
      <h3 className="subheading">ช่วงที่ดำรงตำแหน่ง</h3>
      <div className="term-list">
        {leader.terms.map((item) => (
          <div key={item.id}>
            <span>{item.label}</span>
            <span className="mono">
              {item.start} → {item.end || "ปัจจุบัน"}
            </span>
          </div>
        ))}
      </div>
      {leader.portraitCredit ? (
        <p className="portrait-credit">
          ภาพแสดงตัดกรอบและปรับโทนด้วย CSS · ภาพต้นฉบับ:{" "}
          {leader.portraitCredit.author} · {leader.portraitCredit.license} ·{" "}
          <SourceLink href={leader.portraitCredit.url}>
            ที่มาและสัญญาอนุญาต
          </SourceLink>
        </p>
      ) : null}
    </Modal>
  );
}

function Methodology({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="ตัวเลขเล่าอะไร และไม่ได้เล่าอะไร"
      description="วิธีอ่านดัชนี PMfolio · รุ่น 1"
    >
      <div className="method-lead">
        <span className="eyebrow">PEOPLE. POLICY. PROOF.</span>
        <h3>
          ทุกคะแนนต้องย้อนกลับ
          <br />
          ไปถึงหลักฐานได้
        </h3>
        <p>
          นี่คือดัชนีผลลัพธ์ที่สังเกตได้ในช่วงดำรงตำแหน่ง ไม่ใช่คะแนนความดี
          ความนิยม หรือความสามารถส่วนบุคคล
        </p>
      </div>
      <ol className="method-steps">
        <li>
          <strong>เริ่มที่ข้อมูลจริง</strong>
          <p>
            ใช้ World Bank, WGI และชุดประวัติศาสตร์จาก Maddison, V-Dem, UNDP
            และแหล่งวิจัยที่ตรวจสอบได้ เก็บปี หน่วย และต้นทางไว้ทุกตัวชี้วัด
            ไม่เติมปีที่หายเอง ชุดที่เป็นค่าประมาณย้อนหลังมีคำอธิบายแยก
          </p>
        </li>
        <li>
          <strong>กำหนดปีให้วาระอย่างชัดเจน</strong>
          <p>
            ปีหนึ่งต้องอยู่ภายใต้นายกฯ คนนั้นเกินครึ่งปีปฏิทิน
            จึงนับเป็นปีของวาระ ตัดปีปัจจุบันที่ยังไม่จบออก วันที่เริ่มนับรวม
            วันสิ้นสุดเป็นวันเปลี่ยนผ่านและไม่นับซ้ำให้คนก่อน
            หากไม่มีปีที่ผ่านเกณฑ์เลย จะแสดงข้อมูลทั้งปีที่วาระนั้นคาบเกี่ยว
            พร้อมป้าย “บริบทประเทศ” ซึ่งไม่ใช่ผลงานของวาระสั้นนั้น
          </p>
        </li>
        <li>
          <strong>แปลงเป็นตำแหน่งในชุดข้อมูล 0–100</strong>
          <p>
            นำค่าเฉลี่ยรายปีของวาระไปเทียบการกระจายของตัวชี้วัดเดียวกันในประวัติข้อมูลประเทศไทย
            แล้วกลับทิศสำหรับตัวแปรที่ต่ำกว่าแปลว่าผลลัพธ์ดีขึ้น เช่น
            อัตราตายทารก มีหนึ่งปีจริงก็คำนวณได้โดยติดป้าย “ข้อมูลปีเดียว”
            ใช้ดูตำแหน่งของค่านั้นในชุดอ้างอิง ไม่ได้บอกแนวโน้มหรือผลระยะยาว
          </p>
          <div className="formula">
            100 × (จำนวนค่าที่ต่ำกว่า + ½ จำนวนค่าที่เท่ากัน) ÷ จำนวนปีอ้างอิง
          </div>
        </li>
        <li>
          <strong>VS เทียบชุดตัวชี้วัดร่วมกัน</strong>
          <p>
            คะแนนรายด้านของสองฝั่งใช้เฉพาะตัวชี้วัดที่ทั้งคู่มีข้อมูลพอ
            เลือกแหล่งเดียวกันและไม่คิดซ้ำเมื่อมีชุดหลักกับชุดย้อนหลังของกลุ่มเดียวกัน
            ป้ายใต้ตัวเลขบอกว่ามาจากหลายปี ปีเดียว หรือบริบทประเทศ
            ไม่มีคะแนนรวมตัดสินผู้ชนะ
            หนี้ภาครัฐและตัวชี้วัดที่ตัดสินทิศทางดีเลวไม่ได้จะแสดงเป็นข้อมูลบริบท
          </p>
        </li>
        <li>
          <strong>ข้อมูลขาดคือไม่ทราบ</strong>
          <p>
            เครื่องหมาย — ไม่ใช่ศูนย์ นายกฯ ทุกคนมีแฟ้มประวัติศาสตร์
            แต่จำนวนด้านที่มีสถิติไม่เท่ากัน
            การ์ดเลือกแสดงสูงสุดสามด้านที่มีข้อมูล และแจ้งจำนวนด้านทั้งหมด
            ไม่ใช้ค่าของปีใกล้เคียงมาแทนปีที่ขาด
          </p>
        </li>
      </ol>
      <div className="context-box">
        <CircleHelp size={20} />
        <div>
          <h4>ก่อนเทียบข้ามยุค</h4>
          <p>
            ชุดข้อมูลระยะยาวมีทั้งผลสะสมจากอดีต ความเปลี่ยนแปลงวิธีวัด
            และแนวโน้มของโลก คะแนนสุขภาพหรือโครงสร้างพื้นฐานมักสูงขึ้นตามเวลา
            จึงไม่ใช่การปรับยุคให้ยุติธรรมแล้ว รายจ่ายไม่ใช่ผลสัมฤทธิ์
            และการเติบโตระหว่างวาระไม่ได้แปลว่านายกฯ เป็นสาเหตุทั้งหมด
          </p>
        </div>
      </div>
      <p className="fineprint">
        วันที่ตัดข้อมูลโครงการ {leaderData.asOf} ·
        ปีล่าสุดแตกต่างกันตามตัวชี้วัด ·
        ตัวเลขสามารถถูกปรับปรุงย้อนหลังโดยแหล่งข้อมูล
      </p>
      <SourceLink href="/data/methodology.md">อ่านวิธีวิจัยฉบับเต็ม</SourceLink>
    </Modal>
  );
}

function Sources({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="ห้องหลักฐาน"
      description="เปิดแหล่งต้นทาง ตรวจหน่วยและช่วงข้อมูลได้ทุกชุด"
      wide
    >
      <div className="sources-intro">
        <BookOpen size={28} />
        <p>
          บันทึกประวัติศาสตร์และข้อมูลสถิติแยกแหล่งกัน
          ทุกค่าที่ปรากฏบนเว็บคำนวณจากชุดข้อมูลที่ดาวน์โหลดตรวจสอบได้
        </p>
      </div>
      <div className="download-row">
        <a className="button button-line" href={publicAssetPath("/data/leaders.json")} download>
          <FileText size={16} /> รายชื่อและหลักฐาน
        </a>
        <a className="button button-line" href={publicAssetPath("/data/indicators.json")} download>
          <BarChart3 size={16} /> ตัวเลขรายปี
        </a>
      </div>
      <div className="download-row">
        <SourceLink href="/data/historical-data.md">
          ที่มาข้อมูลเศรษฐกิจย้อนหลัง
        </SourceLink>
        <SourceLink href="/data/extended-data.md">
          ที่มาข้อมูลสังคมและการศึกษา
        </SourceLink>
      </div>
      <h3 className="subheading">รายชื่อ วาระ และประวัติ</h3>
      <div className="historical-sources">
        {leaderData.sources.map((source) => (
          <SourceLink href={source.url} key={source.id}>
            {source.title}
          </SourceLink>
        ))}
      </div>
      <h3 className="subheading">ชุดตัวชี้วัด</h3>
      <div className="source-grid">
        {indicators.map((indicator) => (
          <article key={indicator.id}>
            <div className="source-header">
              <span className="eyebrow">{indicator.categoryLabel}</span>
              <span className="source-code mono">{indicator.source.code}</span>
            </div>
            <h4>{indicator.name}</h4>
            <p>{indicator.description}</p>
            <div className="source-coverage">
              <span>
                {indicator.values.length
                  ? `${indicator.values[0].year}–${indicator.values.at(-1)!.year}`
                  : "ยังไม่มีข้อมูล"}
              </span>
              <span>{indicator.values.length} ปี</span>
              <span>{indicator.unitLabel}</span>
            </div>
            <p className="fineprint">{indicator.notes}</p>
            <SourceLink href={indicator.source.url}>
              {indicator.source.title}
            </SourceLink>
          </article>
        ))}
      </div>
      <p className="fineprint">
        ภาพแต่ละคนมีแหล่งที่มาและสัญญาอนุญาตในหน้าเปิดแฟ้มของบุคคลนั้น
      </p>
    </Modal>
  );
}

function Versus({
  left,
  right,
  setLeft,
  setRight,
  leftTerm,
  rightTerm,
  setLeftTerm,
  setRightTerm,
  onOpen,
  onMethod,
  onRandom,
}: {
  left: Leader;
  right: Leader;
  setLeft: (id: string) => void;
  setRight: (id: string) => void;
  leftTerm: string;
  rightTerm: string;
  setLeftTerm: (id: string) => void;
  setRightTerm: (id: string) => void;
  onOpen: (leader: Leader) => void;
  onMethod: () => void;
  onRandom: () => void;
}) {
  const [mode, setMode] = useState<"score" | "raw">("score");
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState(false);
  const comparison = useMemo(
    () =>
      getComparison(
        left,
        right,
        indicators,
        leaders,
        leftTerm === "all" ? undefined : leftTerm,
        rightTerm === "all" ? undefined : rightTerm,
      ),
    [left, right, leftTerm, rightTerm],
  );
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareFallback(false);
    } catch {
      setCopied(false);
      setShareFallback(true);
    }
  };
  useEffect(() => {
    setCopied(false);
    setShareFallback(false);
  }, [left.id, right.id, leftTerm, rightTerm]);
  const common = comparison.categories.filter(
    (item) => item.leftScore !== null && item.rightScore !== null,
  );
  return (
    <section className="versus-page reveal" id="versus">
      <div className="versus-heading">
        <div>
          <span className="eyebrow">
            <Swords size={14} /> THE COMPARISON ROOM
          </span>
          <h1>
            ต่างวาระ.
            <br className="mobile-break" /> ต่างบริบท.
            <span> เทียบให้เห็น.</span>
          </h1>
          <p>เลือกคู่ เปิดข้อมูล แล้วมองให้ลึกกว่าตัวเลขเดียว</p>
        </div>
        <div className="vs-tools">
          <Button variant="line" onClick={onRandom}>
            <Shuffle size={16} /> สุ่มคู่
          </Button>
          <Button variant="ink" onClick={share}>
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            {copied ? "คัดลอกแล้ว" : "แชร์คู่นี้"}
          </Button>
        </div>
      </div>
      {shareFallback ? (
        <div className="share-fallback">
          <label htmlFor="share-url">คัดลอกลิงก์คู่นี้</label>
          <Input
            id="share-url"
            readOnly
            value={window.location.href}
            onFocus={(event) => event.currentTarget.select()}
            autoFocus
          />
        </div>
      ) : null}
      <div className="matchup">
        <div className="contestant contestant-left">
          <div className="contender-control">
            <span className="eyebrow">RECORD / A</span>
            <Select
              value={left.id}
              onChange={setLeft}
              label="เลือกนายกฯ ฝั่ง A"
              options={leaders
                .filter((item) => item.id !== right.id)
                .map((item) => ({
                  value: item.id,
                  label: `${String(item.ordinal).padStart(2, "0")} · ${item.shortName}`,
                }))}
            />
          </div>
          <div className="contender-identity">
            <button
              onClick={() => onOpen(left)}
              className="contender-portrait"
              aria-label={`เปิดแฟ้ม ${left.name}`}
            >
              <Portrait leader={left} eager />
            </button>
            <div>
              <span className="contender-number">
                {String(left.ordinal).padStart(2, "0")}
              </span>
              <h2>{left.shortName}</h2>
              <p>{left.englishName}</p>
              <span className="mono">{yearRange(left)}</span>
            </div>
          </div>
          <Select
            value={leftTerm}
            onChange={setLeftTerm}
            label="เลือกวาระฝั่ง A"
            options={termOptions(left)}
          />
        </div>
        <div className="vs-seal">
          <span>VS</span>
          <small>ON RECORD</small>
        </div>
        <div className="contestant contestant-right">
          <div className="contender-control">
            <span className="eyebrow">RECORD / B</span>
            <Select
              value={right.id}
              onChange={setRight}
              label="เลือกนายกฯ ฝั่ง B"
              options={leaders
                .filter((item) => item.id !== left.id)
                .map((item) => ({
                  value: item.id,
                  label: `${String(item.ordinal).padStart(2, "0")} · ${item.shortName}`,
                }))}
            />
          </div>
          <div className="contender-identity">
            <button
              onClick={() => onOpen(right)}
              className="contender-portrait"
              aria-label={`เปิดแฟ้ม ${right.name}`}
            >
              <Portrait leader={right} eager />
            </button>
            <div>
              <span className="contender-number">
                {String(right.ordinal).padStart(2, "0")}
              </span>
              <h2>{right.shortName}</h2>
              <p>{right.englishName}</p>
              <span className="mono">{yearRange(right)}</span>
            </div>
          </div>
          <Select
            value={rightTerm}
            onChange={setRightTerm}
            label="เลือกวาระฝั่ง B"
            options={termOptions(right)}
          />
        </div>
      </div>
      <div className="comparison-context">
        <Layers3 size={18} />
        <p>
          มีตัวชี้วัดร่วมที่คำนวณดัชนีได้{" "}
          <strong>
            {comparison.categories.reduce(
              (count, category) => count + category.sharedMetricCount,
              0,
            )}{" "}
            ตัว
          </strong>{" "}
          ใน <strong>{common.length} ด้าน</strong> ·
          อ่านประเภทข้อมูลของแต่ละฝั่งประกอบ
          ค่าจากปีเดียวหรือบริบทประเทศไม่ใช่คำตัดสินว่าใครบริหารดีกว่า
        </p>
        <Button variant="quiet" onClick={onMethod}>
          อ่านวิธีเทียบ <ArrowUpRight size={15} />
        </Button>
      </div>
      <div className="comparison-body">
        <aside className="radar-panel">
          <span className="eyebrow">THE BIG PICTURE</span>
          <h3>ภาพข้อมูลของทั้งสองฝั่ง</h3>
          <Radar rows={common.length >= 3 ? common : comparison.categories} />
          <div className="radar-legend">
            <span>
              <i />
              {left.shortName}
            </span>
            <span>
              <i />
              {right.shortName}
            </span>
          </div>
          <p>
            0–100 คืออันดับสัมพัทธ์ในประวัติข้อมูลไทย
            กราฟแสดงเฉพาะด้านที่เทียบกันได้
            ด้านที่ไม่คิดดัชนีหรือข้อมูลไม่พอไม่ใช่ศูนย์
          </p>
          <div className="vs-context-stat">
            <span>
              {comparison.left.usedYears.length}
              <small>ปีที่เข้าเกณฑ์ฝั่ง A</small>
              <BasisBadge basis={comparison.left.basis} mixed />
            </span>
            <span>
              {comparison.right.usedYears.length}
              <small>ปีที่เข้าเกณฑ์ฝั่ง B</small>
              <BasisBadge basis={comparison.right.basis} mixed />
            </span>
          </div>
        </aside>
        <div className="comparison-table">
          <div className="comparison-table-head">
            <div>
              <span className="eyebrow">SIDE BY SIDE</span>
              <h3>ดูให้ครบทุกด้าน</h3>
            </div>
            <Segmented
              value={mode}
              onChange={setMode}
              label="รูปแบบตัวเลข"
              options={[
                { value: "score", label: "ดัชนี" },
                { value: "raw", label: "ตัวเลขจริง" },
              ]}
            />
          </div>
          <div className="comparison-labels">
            <span>A / {left.shortName}</span>
            <span>B / {right.shortName}</span>
          </div>
          {mode === "score"
            ? comparison.categories.map((category) => (
                <div className="duel-row" key={category.id}>
                  <div className="duel-values">
                    <strong className="left-value">
                      {number(category.leftScore)}
                    </strong>
                    <div>
                      <span>{category.label}</span>
                      <small>
                        {category.sharedMetricCount
                          ? `${category.sharedMetricCount} ตัวชี้วัดร่วม`
                          : indicators.some(
                                (indicator) =>
                                  indicator.category === category.id &&
                                  indicator.scorable,
                              )
                            ? "ข้อมูลร่วมไม่เพียงพอ"
                            : "ข้อมูลบริบท ไม่คิดดัชนี"}
                      </small>
                    </div>
                    <strong className="right-value">
                      {number(category.rightScore)}
                    </strong>
                  </div>
                  <div className="duel-bars">
                    <div>
                      {category.leftScore !== null ? (
                        <i style={{ width: `${category.leftScore}%` }} />
                      ) : null}
                    </div>
                    <div>
                      {category.rightScore !== null ? (
                        <i style={{ width: `${category.rightScore}%` }} />
                      ) : null}
                    </div>
                  </div>
                  <div className="duel-basis">
                    <BasisBadge basis={category.leftBasis} />
                    <BasisBadge basis={category.rightBasis} />
                  </div>
                </div>
              ))
            : comparison.metrics.map((item) => (
                <div className="raw-duel-row" key={item.indicator.id}>
                  <h4>
                    {item.indicator.name}
                    <SourceLink href={item.indicator.source.url}>
                      ที่มา
                    </SourceLink>
                  </h4>
                  {comparison.categories.some((category) =>
                    category.metricIds.includes(item.indicator.id),
                  ) ? (
                    <span className="vs-source-badge">ใช้คำนวณดัชนี VS</span>
                  ) : null}
                  <div className="raw-duel-values">
                    <div>
                      <strong>
                        {formatRaw(item.left.average, item.indicator)}
                      </strong>
                      <small>
                        {item.left.years.length
                          ? `${formatYears(item.left.years)} · ${item.left.sampleCount} ปี`
                          : "ไม่มีข้อมูลช่วงนี้"}
                      </small>
                      <BasisBadge basis={item.left.basis} />
                    </div>
                    <div>
                      <strong>
                        {formatRaw(item.right.average, item.indicator)}
                      </strong>
                      <small>
                        {item.right.years.length
                          ? `${formatYears(item.right.years)} · ${item.right.sampleCount} ปี`
                          : "ไม่มีข้อมูลช่วงนี้"}
                      </small>
                      <BasisBadge basis={item.right.basis} />
                    </div>
                  </div>
                  <p>
                    ค่าเฉลี่ยรายปี · {item.indicator.unitLabel}
                    {!item.indicator.scorable
                      ? " · ใช้ประกอบบริบท ไม่คิดคะแนน"
                      : ""}
                  </p>
                </div>
              ))}
        </div>
      </div>
      <div className="record-comparison">
        <div>
          <span className="eyebrow">BEHIND THE NUMBERS / A</span>
          <h3>บันทึกของ{left.shortName}</h3>
          {left.highlights.map((item, i) => (
            <article key={i}>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
              <SourceLink href={item.sourceUrl}>หลักฐานต้นทาง</SourceLink>
            </article>
          ))}
        </div>
        <div>
          <span className="eyebrow">BEHIND THE NUMBERS / B</span>
          <h3>บันทึกของ{right.shortName}</h3>
          {right.highlights.map((item, i) => (
            <article key={i}>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
              <SourceLink href={item.sourceUrl}>หลักฐานต้นทาง</SourceLink>
            </article>
          ))}
        </div>
      </div>
      <div className="vs-bottom">
        <Fingerprint size={25} />
        <p>ไม่มีผู้ชนะสำเร็จรูป มีข้อมูลให้คุณอ่านต่อ</p>
        <Button variant="line" onClick={onRandom}>
          ลองอีกคู่ <Shuffle size={15} />
        </Button>
      </div>
    </section>
  );
}

export default function App() {
  const [initialParams] = useState(() => new URLSearchParams(window.location.search));
  const initialLeader = (key: string) =>
    leaders.find((leader) => leader.id === initialParams.get(key));
  const [view, setView] = useState<"roster" | "vs">(
    initialParams.get("view") === "vs" ? "vs" : "roster",
  );
  const [search, setSearch] = useState("");
  const [era, setEra] = useState("all");
  const [sort, setSort] = useState("ordinal");
  const [layout, setLayout] = useState<"cards" | "timeline">("cards");
  const [selected, setSelected] = useState<string[]>([]);
  const [profile, setProfile] = useState<Leader | null>(
    initialLeader("profile") || null,
  );
  const [sheet, setSheet] = useState<"method" | "sources" | null>(null);
  const [left, setLeftId] = useState(initialLeader("left") || defaultLeft);
  const [right, setRightId] = useState(() => {
    const candidate = initialLeader("right") || defaultRight;
    return candidate.id === (initialLeader("left") || defaultLeft).id
      ? leaders.find((item) => item.id !== candidate.id)!
      : candidate;
  });
  const validTerm = (leader: Leader, value: string | null) =>
    value && leader.terms.some((term) => term.id === value) ? value : "all";
  const [leftTerm, setLeftTerm] = useState(
    validTerm(left, initialParams.get("lt")),
  );
  const [rightTerm, setRightTerm] = useState(
    validTerm(right, initialParams.get("rt")),
  );
  const [notice, setNotice] = useState("");
  const filtered = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            (era === "all" || leader.era === era) &&
            `${leader.name} ${leader.shortName} ${leader.englishName} ${leader.ordinal}`
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()),
        )
        .sort((a, b) =>
          sort === "recent" ? b.ordinal - a.ordinal : a.ordinal - b.ordinal,
        ),
    [search, era, sort],
  );
  const setLeft = (id: string) => {
    setLeftId(leaders.find((item) => item.id === id)!);
    setLeftTerm("all");
  };
  const setRight = (id: string) => {
    setRightId(leaders.find((item) => item.id === id)!);
    setRightTerm("all");
  };
  const go = (next: "roster" | "vs") => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const params = new URLSearchParams();
    if (view === "vs") {
      params.set("view", "vs");
      params.set("left", left.id);
      params.set("right", right.id);
      if (leftTerm !== "all") params.set("lt", leftTerm);
      if (rightTerm !== "all") params.set("rt", rightTerm);
    }
    if (profile) params.set("profile", profile.id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [view, left.id, right.id, leftTerm, rightTerm, profile]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const toggleSelected = (leader: Leader) =>
    setSelected((current) => {
      if (current.includes(leader.id))
        return current.filter((id) => id !== leader.id);
      if (current.length === 2) {
        setNotice("เลือกไว้สองคนแล้ว นำคนหนึ่งออกก่อนเปลี่ยนคู่");
        return current;
      }
      return [...current, leader.id];
    });
  const launch = () => {
    if (selected.length !== 2) return;
    setLeft(selected[0]);
    setRight(selected[1]);
    setSelected([]);
    go("vs");
  };
  const random = () => {
    const pool = leaders.filter(
      (item) => metricCache.get(item.id)!.scoredCategoryCount >= 3,
    );
    const first = pool[Math.floor(Math.random() * pool.length)];
    const remaining = pool.filter((item) => item.id !== first.id);
    const second = remaining[Math.floor(Math.random() * remaining.length)];
    setLeft(first.id);
    setRight(second.id);
    go("vs");
  };
  const featured = [
    leaders[0],
    leaders.find((item) => item.ordinal === 7) || leaders[6],
    leaders.find((item) => item.ordinal === 18) || leaders[17],
  ];
  return (
    <>
      <a href="#main" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            onClick={() => go("roster")}
            className="brand-button"
            aria-label="PMfolio หน้าแรก"
          >
            <Mark />
          </button>
          <nav aria-label="เมนูหลัก">
            <Button
              variant="quiet"
              className={view === "roster" ? "nav-active" : ""}
              onClick={() => go("roster")}
            >
              รายชื่อผู้นำ <span className="nav-en">ROSTER</span>
            </Button>
            <Button
              variant="quiet"
              className={view === "vs" ? "nav-active" : ""}
              onClick={() => go("vs")}
            >
              <Swords size={15} /> VS <span className="nav-en">COMPARE</span>
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setLayout("timeline");
                go("roster");
                window.setTimeout(
                  () =>
                    document
                      .getElementById("archive")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  50,
                );
              }}
            >
              เส้นเวลา
            </Button>
            <Button variant="quiet" onClick={() => setSheet("sources")}>
              หลักฐาน <ArrowUpRight size={13} />
            </Button>
          </nav>
          <span className="header-edition mono">
            THAILAND
            <br />
            PUBLIC RECORD / 01
          </span>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {view === "roster" ? (
          <>
            <section className="hero page-width">
              <div className="hero-copy reveal">
                <span className="eyebrow">
                  <i className="status-dot" /> THE PRIME MINISTER ARCHIVE
                </span>
                <h1>
                  Every term.
                  <br />
                  <span>On record.</span>
                  <span className="hero-asterisk" aria-hidden="true">
                    ✳
                  </span>
                </h1>
                <h2>เปิดแฟ้มผู้นำไทย</h2>
                <p>
                  มองนายกฯ ผ่านผลงาน ตัวเลข และบริบท
                  <br className="desktop-break" /> สำรวจทุกวาระ
                  ตั้งแต่คนแรกจนถึงปัจจุบัน
                </p>
                <div className="hero-actions">
                  <a href="#archive" className="button button-ink">
                    สำรวจรายชื่อ <ArrowDown size={16} />
                  </a>
                  <Button variant="line" onClick={() => go("vs")}>
                    <Swords size={16} /> จับคู่ VS
                  </Button>
                </div>
                <div className="hero-footnote">
                  <Fingerprint size={17} />
                  <span>ทุกวาระ มีหลักฐาน</span>
                  <span className="mono">EST. 1932 →</span>
                </div>
              </div>
              <div
                className="hero-roster reveal"
                aria-label="ตัวอย่างแฟ้มผู้นำ"
              >
                <div className="hero-roster-label mono">
                  <span>A COLLECTION OF PUBLIC RECORDS</span>
                  <span>01 / {leaders.length}</span>
                </div>
                <div className="hero-cards">
                  {featured.map((leader, index) => (
                    <button
                      key={leader.id}
                      className={`hero-card hero-card-${index}`}
                      onClick={() => setProfile(leader)}
                    >
                      <span className="hero-card-no">
                        {String(leader.ordinal).padStart(2, "0")}
                      </span>
                      <Portrait leader={leader} eager />
                      <div className="hero-card-caption">
                        <span className="mono">{shortRange(leader)}</span>
                        <strong>{leader.shortName}</strong>
                        <span>
                          {index === 0
                            ? "THE FIRST CHAPTER"
                            : "EXPLORE THE RECORD"}
                          <ArrowUpRight size={13} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="hero-roster-bottom">
                  <span className="mono">PEOPLE. POLICY. PROOF.</span>
                  <span>ประวัติศาสตร์ที่เปิดอ่านได้</span>
                  <ArrowDown size={17} />
                </div>
              </div>
            </section>
            <div className="archive-strip">
              <div className="page-width">
                <span>
                  <strong>{String(leaders.length).padStart(2, "0")}</strong>{" "}
                  นายกรัฐมนตรี
                </span>
                <span>
                  <strong>09</strong> มุมมองของข้อมูล
                </span>
                <span>
                  <strong>1932</strong> จุดเริ่มต้นของเรื่องราว
                </span>
                <Button variant="quiet" onClick={() => setSheet("method")}>
                  <CircleHelp size={16} /> ค่าพลังคิดอย่างไร{" "}
                  <ArrowUpRight size={15} />
                </Button>
              </div>
            </div>
            <section id="archive" className="archive page-width">
              <div className="section-heading reveal">
                <div>
                  <span className="eyebrow">
                    THE ROSTER / ทำความรู้จักผ่านหลักฐาน
                  </span>
                  <h2>
                    ผู้นำไทย
                    <span className="heading-count">
                      {String(leaders.length).padStart(2, "0")}
                    </span>
                  </h2>
                </div>
                <p>
                  แต่ละคนมีเรื่องราว
                  <br />
                  แต่ละวาระมีบริบท
                </p>
              </div>
              <div className="archive-toolbar reveal">
                <div className="search-control">
                  <Search size={17} />
                  <Input
                    aria-label="ค้นหาชื่อหรือลำดับนายกฯ"
                    placeholder="ค้นหาชื่อ หรือลำดับนายกฯ..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search ? (
                    <Button
                      variant="quiet"
                      onClick={() => setSearch("")}
                      aria-label="ล้างคำค้น"
                    >
                      <X size={15} />
                    </Button>
                  ) : null}
                </div>
                <div className="filter-controls">
                  <Select
                    value={era}
                    onChange={setEra}
                    label="เลือกยุค"
                    options={[
                      { value: "all", label: "ทุกยุคสมัย" },
                      ...Object.entries(eraNames).map(([value, label]) => ({
                        value,
                        label,
                      })),
                    ]}
                  />
                  <Select
                    value={sort}
                    onChange={setSort}
                    label="เรียงรายชื่อ"
                    options={[
                      { value: "ordinal", label: "คนแรก → ปัจจุบัน" },
                      { value: "recent", label: "ปัจจุบัน → คนแรก" },
                    ]}
                  />
                  <Segmented
                    value={layout}
                    onChange={setLayout}
                    label="รูปแบบรายชื่อ"
                    options={[
                      {
                        value: "cards",
                        ariaLabel: "แสดงแบบการ์ด",
                        label: (
                          <>
                            <Layers3 size={15} />
                            <span>การ์ด</span>
                          </>
                        ),
                      },
                      {
                        value: "timeline",
                        ariaLabel: "แสดงแบบเส้นเวลา",
                        label: (
                          <>
                            <ArrowDownUp size={15} />
                            <span>เส้นเวลา</span>
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="archive-legend">
                <span className="mono">
                  {String(filtered.length).padStart(2, "0")} RECORDS
                </span>
                <span>
                  <i className="status-dot" />
                  ดัชนีจากข้อมูลจริง · อ่านป้ายประเภทข้อมูล{" "}
                  <Button
                    variant="quiet"
                    onClick={() => setSheet("method")}
                    aria-label="อ่านวิธีคิดดัชนี"
                  >
                    <CircleHelp size={13} />
                  </Button>
                </span>
              </div>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <Search size={30} />
                  <h3>ยังไม่พบรายชื่อนี้</h3>
                  <p>ลองค้นด้วยชื่อ นามสกุล หรือล้างตัวกรอง</p>
                  <Button
                    variant="line"
                    onClick={() => {
                      setSearch("");
                      setEra("all");
                    }}
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              ) : layout === "cards" ? (
                <div className="roster-grid">
                  {filtered.map((leader, index) => (
                    <RosterCard
                      key={leader.id}
                      leader={leader}
                      index={index}
                      selected={selected.includes(leader.id)}
                      onSelect={() => toggleSelected(leader)}
                      onOpen={() => setProfile(leader)}
                    />
                  ))}
                </div>
              ) : (
                <div className="timeline-list">
                  {filtered.map((leader) => (
                    <article key={leader.id} className="timeline-record reveal">
                      <div className="timeline-year mono">
                        {year(leader.terms[0].start)}
                        <i />
                      </div>
                      <button
                        className="timeline-portrait"
                        onClick={() => setProfile(leader)}
                        aria-label={`เปิดแฟ้ม ${leader.name}`}
                      >
                        <Portrait leader={leader} />
                      </button>
                      <div>
                        <span className="eyebrow">
                          PRIME MINISTER /{" "}
                          {String(leader.ordinal).padStart(2, "0")}
                        </span>
                        <button
                          onClick={() => setProfile(leader)}
                          className="timeline-name"
                        >
                          {leader.name}
                        </button>
                        <p>{leader.summary}</p>
                        <span className="mono timeline-dates">
                          {yearRange(leader)}
                        </span>
                      </div>
                      <Button
                        variant={selected.includes(leader.id) ? "lime" : "line"}
                        onClick={() => toggleSelected(leader)}
                        aria-pressed={selected.includes(leader.id)}
                      >
                        <Swords size={15} /> VS
                      </Button>
                    </article>
                  ))}
                </div>
              )}
              <div className="archive-note">
                <CircleHelp size={18} />
                <p>
                  เครื่องหมาย — หมายถึงข้อมูลไม่เพียงพอสำหรับคำนวณดัชนี
                  ไม่ใช่คะแนนศูนย์
                  <br />
                  ข้อมูลเริ่มต่างปีกัน
                  ผลลัพธ์ข้ามยุคจึงควรอ่านพร้อมบริบทและตัวเลขต้นทาง
                </p>
                <Button variant="quiet" onClick={() => setSheet("method")}>
                  วิธีอ่านข้อมูล <ArrowUpRight size={15} />
                </Button>
              </div>
            </section>
            <section className="vs-invite page-width">
              <div className="invite-symbol" aria-hidden="true">
                VS<span>?</span>
              </div>
              <div>
                <span className="eyebrow">A DIFFERENT WAY TO READ HISTORY</span>
                <h2>
                  ถ้าวางสองวาระ
                  <br />
                  ไว้ข้างกันล่ะ?
                </h2>
                <p>
                  เห็นความต่างผ่านกราฟ ตัวเลข และบันทึกจริง
                  <br />
                  ไม่มีคำตอบสำเร็จรูป มีหลักฐานให้คุณมองต่อ
                </p>
                <Button variant="lime" onClick={random}>
                  สุ่มคู่ เปิดมุมใหม่ <Shuffle size={16} />
                </Button>
              </div>
              <span className="invite-side mono">
                COMPARE RECORDS
                <br />
                UNDERSTAND CONTEXT
              </span>
            </section>
          </>
        ) : (
          <div className="page-width">
            <Versus
              left={left}
              right={right}
              setLeft={setLeft}
              setRight={setRight}
              leftTerm={leftTerm}
              rightTerm={rightTerm}
              setLeftTerm={setLeftTerm}
              setRightTerm={setRightTerm}
              onOpen={setProfile}
              onMethod={() => setSheet("method")}
              onRandom={random}
            />
          </div>
        )}
      </main>
      <footer className="site-footer page-width">
        <div>
          <Mark small />
          <p>ทุกวาระ มีหลักฐาน</p>
        </div>
        <div>
          <span className="eyebrow">AN INDEPENDENT PUBLIC DATA PROJECT</span>
          <p>
            เพื่อสำรวจประวัติศาสตร์และผลลัพธ์ของนโยบาย
            <br />
            ไม่เกี่ยวข้องกับพรรคการเมืองหรือหน่วยงานรัฐ
          </p>
        </div>
        <div className="footer-links">
          <Button variant="quiet" onClick={() => setSheet("method")}>
            วิธีคิดดัชนี <ArrowUpRight size={13} />
          </Button>
          <Button variant="quiet" onClick={() => setSheet("sources")}>
            แหล่งข้อมูล <ArrowUpRight size={13} />
          </Button>
          <span className="mono">DATA SNAPSHOT / {leaderData.asOf}</span>
        </div>
      </footer>
      {selected.length > 0 && view === "roster" ? (
        <aside
          className="selection-tray"
          aria-label="รายชื่อที่เลือกเปรียบเทียบ"
        >
          <div className="tray-label">
            <Swords size={22} />
            <span>
              เลือกคู่ VS<small>{selected.length} / 2 RECORDS</small>
            </span>
          </div>
          <div className="tray-people">
            {[0, 1].map((index) => {
              const leader = leaders.find(
                (item) => item.id === selected[index],
              );
              return leader ? (
                <div className="tray-person" key={leader.id}>
                  <span>{leader.shortName}</span>
                  <Button
                    variant="quiet"
                    onClick={() => toggleSelected(leader)}
                    aria-label={`นำ ${leader.name} ออกจากคู่`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <span key="empty" className="tray-empty">
                  เลือกอีกหนึ่งคน
                </span>
              );
            })}
          </div>
          <Button
            variant="lime"
            disabled={selected.length !== 2}
            onClick={launch}
          >
            เปิด VS <ArrowRight size={17} />
          </Button>
          <Button
            variant="quiet"
            className="tray-clear"
            onClick={() => setSelected([])}
            aria-label="ล้างคู่ที่เลือก"
          >
            <X size={19} />
          </Button>
        </aside>
      ) : null}
      {notice ? (
        <div className="toast" role="status">
          {notice}
        </div>
      ) : null}
      <Profile
        leader={profile}
        onClose={() => setProfile(null)}
        onCompare={(leader) => {
          toggleSelected(leader);
          setProfile(null);
          if (view === "vs") go("roster");
        }}
      />
      {sheet === "method" ? (
        <Methodology onClose={() => setSheet(null)} />
      ) : sheet === "sources" ? (
        <Sources onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}
