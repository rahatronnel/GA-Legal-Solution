
"use client";

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeInputProps {
  value: string; // "HH:MM AM/PM"
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const [time, period] = value ? value.split(' ') : ['', 'PM'];
  const [hh, mm] = time ? time.split(':') : ['', ''];

  const mmRef = useRef<HTMLInputElement>(null);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    const sanitizedValue = rawValue.replace(/\D/g, ''); // Remove non-digits

    let newHh = hh;
    let newMm = mm;

    if (name === 'hh') {
      newHh = sanitizedValue;
      if (sanitizedValue.length === 2) {
        mmRef.current?.focus();
      }
    } else {
      newMm = sanitizedValue;
    }

    onChange(`${newHh}:${newMm} ${period}`);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    onChange(`${hh}:${mm} ${newPeriod}`);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        name="hh"
        placeholder="HH"
        maxLength={2}
        value={hh}
        onChange={handleTimeChange}
        className="w-16 text-center"
      />
      <span>:</span>
      <Input
        ref={mmRef}
        name="mm"
        placeholder="MM"
        maxLength={2}
        value={mm}
        onChange={handleTimeChange}
        className="w-16 text-center"
      />
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
