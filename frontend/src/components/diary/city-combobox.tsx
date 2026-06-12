'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { type City, loadCities, searchCities } from '@/lib/cities';
import { cn } from '@/lib/utils';

function cityLabel(c: City): string {
  const city = c.ko ? `${c.city} (${c.ko})` : c.city;
  return `${city}, ${c.country}`;
}

// 데이터셋에서 도시를 검색해 선택하는 콤보박스. 선택 시 City 객체를 onChange로 넘긴다.
export function CityCombobox({
  value,
  onChange,
  invalid,
}: {
  value: City | null;
  onChange: (city: City) => void;
  invalid?: boolean;
}) {
  const listId = useId();
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void loadCities().then((c) => {
      if (active) setCities(c);
    });
    return () => {
      active = false;
    };
  }, []);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const results = open ? searchCities(cities, query) : [];
  // 입력 중이면 query, 아니면 선택값 라벨을 보여준다
  const display = open ? query : value ? cityLabel(value) : '';

  function select(city: City) {
    onChange(city);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && results[highlight]) {
        e.preventDefault();
        select(results[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="도시 검색 (예: Seoul)"
        aria-invalid={invalid || undefined}
        value={display}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {results.map((c, i) => (
            <li
              key={`${c.city}|${c.country}`}
              role="option"
              aria-selected={i === highlight}
              // onMouseDown로 input blur보다 먼저 선택 처리
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                'cursor-pointer px-3 py-1.5 text-sm text-popover-foreground',
                i === highlight && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="font-medium">{c.city}</span>
              {c.ko && <span className="text-muted-foreground"> {c.ko}</span>}
              <span className="text-muted-foreground"> · {c.country}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
          검색 결과 없음
        </div>
      )}
    </div>
  );
}
