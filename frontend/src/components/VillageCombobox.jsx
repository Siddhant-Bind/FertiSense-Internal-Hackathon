import { useEffect, useId, useMemo, useRef, useState } from "react";

const MAX_SHOWN = 80;

/**
 * Searchable village picker. Districts can have 1,800+ villages, so a plain <select> is unusable;
 * this filters as you type (matches at the start of a word rank first) and supports the keyboard.
 */
export default function VillageCombobox({ id, villages, loading, value, onChange, disabled, invalid }) {
  const [query, setQuery] = useState(value?.village_name || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId().replace(/:/g, "") + "-list";
  const wrap = useRef(null);
  const list = useRef(null);

  useEffect(() => { setQuery(value?.village_name || ""); }, [value]);
  useEffect(() => {
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setQuery(value?.village_name || ""); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === value?.village_name?.toLowerCase()) return villages.slice(0, MAX_SHOWN);
    const starts = [], contains = [];
    for (const v of villages) {
      const n = v.village_name.toLowerCase();
      if (n.startsWith(q) || n.includes(" " + q)) starts.push(v);
      else if (n.includes(q)) contains.push(v);
      if (starts.length >= MAX_SHOWN) break;
    }
    return starts.concat(contains).slice(0, MAX_SHOWN);
  }, [query, villages, value]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [active]);

  const pick = (v) => { onChange(v); setQuery(v.village_name); setOpen(false); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && matches[active]) { e.preventDefault(); pick(matches[active]); }
    else if (e.key === "Escape") { setOpen(false); setQuery(value?.village_name || ""); }
  };

  const placeholder = disabled ? "Choose district first" : loading ? "Loading villages…" : `Search ${villages.length.toLocaleString("en-IN")} villages`;
  return (
    <div className="combo" ref={wrap}>
      <input
        id={id} className="input" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined} aria-invalid={invalid || undefined}
        autoComplete="off" disabled={disabled || loading} placeholder={placeholder} value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(null); }}
        onFocus={(e) => { setOpen(true); e.target.select(); }} onKeyDown={onKey}
      />
      <span className="combo-caret" aria-hidden="true">▾</span>
      {open && !disabled && !loading && (
        <ul className="combo-list" id={listId} role="listbox" ref={list}>
          {matches.length === 0 && <li className="combo-empty">No village matches “{query}”.</li>}
          {matches.map((v, i) => (
            <li key={v.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={i === active ? "active" : ""} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(v); }}>
              <span>{v.village_name}</span>
            </li>
          ))}
          {matches.length === MAX_SHOWN && <li className="combo-empty">Keep typing to narrow the list.</li>}
        </ul>
      )}
    </div>
  );
}
