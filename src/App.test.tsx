// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import leaderData from './data/leaders.json';
import indicatorData from './data/indicators.json';
import { indicators } from './data/catalog';

beforeEach(() => {
  window.history.replaceState(null, '', '/pmfolip/');
  vi.stubEnv('BASE_URL', '/pmfolip/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('roster to comparison flow', () => {
  it('opens shared comparisons under the Pages path and keeps assets and evidence links usable', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/pmfolip/?view=vs&left=abhisit&right=thaksin');
    render(<App />);
    expect(screen.getByRole('combobox', { name: 'เลือกนายกฯ ฝั่ง A' }).textContent).toContain('อภิสิทธิ์');
    expect(screen.getByRole('combobox', { name: 'เลือกนายกฯ ฝั่ง B' }).textContent).toContain('ทักษิณ');
    const images = [...document.querySelectorAll('img')];
    expect(images.length).toBeGreaterThan(2);
    for (const image of images) expect(image.getAttribute('src')).toMatch(/^\/pmfolip\//);
    await user.click(screen.getByRole('button', { name: 'แหล่งข้อมูล' }));
    const dialog = await screen.findByRole('dialog', { name: 'ห้องหลักฐาน' });
    expect(within(dialog).getByRole('link', { name: 'รายชื่อและหลักฐาน' }).getAttribute('href')).toBe('/pmfolip/data/leaders.json');
    expect(within(dialog).getByRole('link', { name: 'ตัวเลขรายปี' }).getAttribute('href')).toBe('/pmfolip/data/indicators.json');
    expect(within(dialog).getByRole('link', { name: /ที่มาข้อมูลเศรษฐกิจย้อนหลัง/ }).getAttribute('href')).toBe('/pmfolip/data/historical-data.md');
    expect([...dialog.querySelectorAll('a')].some((link) => link.getAttribute('href') === leaderData.sources[0].url)).toBe(true);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'แชร์คู่นี้' }));
    const shared = new URL(await navigator.clipboard.readText());
    expect(shared.pathname).toBe('/pmfolip/');
    expect(shared.searchParams.get('left')).toBe('abhisit');
    expect(shared.searchParams.get('right')).toBe('thaksin');
  });

  it('searches the full roster, explains empty results, and restores the list', async () => {
    const user = userEvent.setup();
    render(<App />);
    const main = screen.getByRole('main');
    const search = screen.getByRole('textbox', { name: 'ค้นหาชื่อหรือลำดับนายกฯ' });
    expect(within(main).getAllByRole('article')).toHaveLength(leaderData.leaders.length);

    const known = leaderData.leaders.find((leader) => leader.id === 'thaksin')!;
    await user.type(search, known.shortName);
    expect(within(main).getAllByRole('article')).toHaveLength(1);
    expect(within(main).getByRole('button', { name: `เปิดแฟ้ม ${known.name}` })).toBeDefined();

    await user.clear(search);
    await user.type(search, 'ไม่ใช่ชื่อนายกรัฐมนตรีคนใด');
    expect(within(main).queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'ยังไม่พบรายชื่อนี้' })).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'ล้างตัวกรอง' }));
    expect((search as HTMLInputElement).value).toBe('');
    expect(within(main).getAllByRole('article')).toHaveLength(leaderData.leaders.length);
  });

  it('selects exactly two different leaders and carries that pair into the share URL', async () => {
    const user = userEvent.setup();
    render(<App />);
    const left = leaderData.leaders.find((leader) => leader.id === 'thaksin')!;
    const right = leaderData.leaders.find((leader) => leader.id === 'abhisit')!;
    await user.click(screen.getByRole('button', { name: `เพิ่มใน VS: ${left.name}` }));
    const tray = screen.getByRole('complementary', { name: 'รายชื่อที่เลือกเปรียบเทียบ' });
    expect((within(tray).getByRole('button', { name: 'เปิด VS' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: `เพิ่มใน VS: ${right.name}` }));
    expect((within(tray).getByRole('button', { name: 'เปิด VS' }) as HTMLButtonElement).disabled).toBe(false);

    const third = leaderData.leaders[0];
    await user.click(screen.getByRole('button', { name: `เพิ่มใน VS: ${third.name}` }));
    expect(screen.getByRole('status').textContent).toContain('เลือกไว้สองคนแล้ว');
    expect(within(tray).queryByText(third.shortName)).toBeNull();
    await user.click(within(tray).getByRole('button', { name: 'เปิด VS' }));

    const query = new URLSearchParams(window.location.search);
    expect(query.get('view')).toBe('vs');
    expect(query.get('left')).toBe(left.id);
    expect(query.get('right')).toBe(right.id);
    expect(query.get('left')).not.toBe(query.get('right'));
    expect(screen.getByRole('combobox', { name: 'เลือกนายกฯ ฝั่ง A' }).textContent).toContain(left.shortName);
    expect(screen.getByRole('combobox', { name: 'เลือกนายกฯ ฝั่ง B' }).textContent).toContain(right.shortName);
    expect(screen.queryByRole('complementary', { name: 'รายชื่อที่เลือกเปรียบเทียบ' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'แชร์คู่นี้' }));
    expect(await navigator.clipboard.readText()).toBe(window.location.href);
    expect(window.location.pathname).toBe('/pmfolip/');
    expect(screen.getByRole('button', { name: 'คัดลอกแล้ว' })).toBeDefined();
  });

  it('keeps fiscal context unscored and exposes real means, units, and WGI scale in raw mode', async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: 'เมนูหลัก' });
    await user.click(within(navigation).getByRole('button', { name: /VS/ }));

    const context = screen.getByText('ข้อมูลบริบท ไม่คิดดัชนี');
    const fiscalRow = context.closest('.duel-row') as HTMLElement;
    expect(within(fiscalRow).getByText('การคลัง')).toBeDefined();
    expect(within(fiscalRow).getAllByText('—')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'ตัวเลขจริง' }));

    const growth = screen.getByRole('heading', { name: /^GDP เติบโตจริง/ }).closest('.raw-duel-row') as HTMLElement;
    expect(within(growth).getByText('ค่าเฉลี่ยรายปี · % ต่อปี')).toBeDefined();
    // The selected default term owns 2001–2006; independently average the source
    // observations to catch a UI accidentally displaying a percentile as raw GDP.
    const values = indicatorData.indicators.find((indicator) => indicator.id === 'gdp-growth')!.values
      .filter((point) => point.year >= 2001 && point.year <= 2006);
    const actualMean = values.reduce((sum, point) => sum + point.value, 0) / values.length;
    const expected = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(actualMean);
    expect(within(growth).getByText(expected)).toBeDefined();
    expect(within(growth).getByText('2001–2006 · 6 ปี')).toBeDefined();

    const debt = screen.getByRole('heading', { name: /^หนี้รัฐบาลกลางต่อ GDP/ }).closest('.raw-duel-row') as HTMLElement;
    expect(within(debt).getByText('ค่าเฉลี่ยรายปี · % ของ GDP · ใช้ประกอบบริบท ไม่คิดคะแนน')).toBeDefined();
    expect(within(debt).queryByText('ไม่มีข้อมูล')).toBeNull();
    const mortality = screen.getByRole('heading', { name: /^การเสียชีวิตทารก/ }).closest('.raw-duel-row') as HTMLElement;
    expect(within(mortality).getByText('ค่าเฉลี่ยรายปี · ต่อการเกิดมีชีพ 1,000 คน')).toBeDefined();
    expect(screen.getAllByText('ค่าเฉลี่ยรายปี · คะแนน WGI 0–100')).toHaveLength(2);
  });

  it('opens an early historical profile without fabricated data and returns keyboard focus on close', async () => {
    const user = userEvent.setup();
    render(<App />);
    const first = leaderData.leaders[0];
    const opener = screen.getByRole('button', { name: `เปิดแฟ้ม ${first.name}` });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: first.name });
    expect(new URLSearchParams(window.location.search).get('profile')).toBe(first.id);
    const democracyIndicator = indicators.find((indicator) => indicator.id === 'vdem-electoral-democracy')!;
    const democracy = within(dialog).getByRole('heading', { name: democracyIndicator.name }).closest('article')!;
    const source1932 = democracyIndicator.values.find((point) => point.year === 1932)!.value;
    expect(within(democracy).queryByText('ไม่มีข้อมูล')).toBeNull();
    expect(within(democracy).getByText('ข้อมูลปีเดียว')).toBeDefined();
    expect(within(democracy).getByText(new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(source1932))).toBeDefined();
    const historicalGdp = indicators.find((indicator) => indicator.id === 'historical-gdp-per-capita')!;
    const economy = within(dialog).getByRole('heading', { name: historicalGdp.name }).closest('article')!;
    expect(within(economy).getByText('ไม่มีข้อมูล')).toBeDefined();
    const mortality = within(dialog).getByRole('heading', { name: 'การเสียชีวิตทารก' }).closest('article')!;
    expect(within(mortality).getByText('ต่อการเกิดมีชีพ 1,000 คน')).toBeDefined();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(new URLSearchParams(window.location.search).has('profile')).toBe(false);
  });

  it('keeps layout switches named even when their visual text is hidden on mobile', () => {
    render(<App />);
    const switches = screen.getByRole('group', { name: 'รูปแบบรายชื่อ' });
    const buttons = within(switches).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => Boolean(button.getAttribute('aria-label')))).toBe(true);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
  });

  it('gives every roster card available scores and uses compact labels for narrow cards', () => {
    render(<App />);
    const cards = within(screen.getByRole('main')).getAllByRole('article');
    for (const card of cards) {
      const rows = card.querySelectorAll('.score-bars-compact .score-row');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(3);
      for (const row of rows) expect(row.querySelector('strong')!.textContent).toMatch(/^\d+$/);
      const economy = card.querySelector('.score-row > span[title="เศรษฐกิจและรายได้"]');
      if (economy) expect(economy.textContent).toBe('เศรษฐกิจ');
    }
  });

  it('labels annual context for a short tenure and shows which exact sources VS uses', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const id of ['thawi', 'thaksin']) {
      const leader = leaderData.leaders.find((entry) => entry.id === id)!;
      await user.click(screen.getByRole('button', { name: `เพิ่มใน VS: ${leader.name}` }));
    }
    await user.click(screen.getByRole('button', { name: 'เปิด VS' }));
    expect(screen.getAllByText('บริบทประเทศ').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'ตัวเลขจริง' }));
    const democracy = screen.getByRole('heading', { name: /^ประชาธิปไตยด้านการเลือกตั้ง/ }).closest('.raw-duel-row')!;
    expect(within(democracy as HTMLElement).getByText('ใช้คำนวณดัชนี VS')).toBeDefined();
    expect(within(democracy as HTMLElement).getByText('บริบทประเทศ')).toBeDefined();
    const wgi = screen.getByRole('heading', { name: /^สิทธิและการตรวจสอบอำนาจ/ }).closest('.raw-duel-row')!;
    expect(within(wgi as HTMLElement).queryByText('ใช้คำนวณดัชนี VS')).toBeNull();
  });
});
