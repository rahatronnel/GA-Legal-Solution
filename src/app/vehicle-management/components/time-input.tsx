"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeInputProps {
  value: string; // "HH:MM AM/PM"
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const [time, period] = value ? value.split(' ') : ['', 'PM'];
  const [hh, mm] = time ? time.split(':') : ['', ''];

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    let newTime = name === 'hh' ? `${rawValue}:${mm}` : `${hh}:${rawValue}`;
    onChange(`${newTime} ${period}`);
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
