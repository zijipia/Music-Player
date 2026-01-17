"use client";

import type React from "react";
import { useState } from "react";

interface SearchBarProps {
	onSearch: (query: string, source: string) => void;
	disabled?: boolean;
}

export function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
	const [query, setQuery] = useState("");
	const [source, setSource] = useState("all");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim() && !disabled) {
			onSearch(query, source);
		}
	};

	return (
		<div className='border-b border-border bg-card/30 p-6'>
			<form
				onSubmit={handleSubmit}
				className='space-y-3'>
				<div className='flex gap-3'>
					<input
						type='text'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onSubmit={handleSubmit}
						placeholder='Search songs, artists, playlists...'
						disabled={disabled}
						className={`flex-1 rounded-lg bg-input px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
							disabled ? "opacity-50 cursor-not-allowed" : ""
						}`}
					/>
					<button
						type='submit'
						disabled={disabled}
						className={`rounded-lg bg-primary px-6 py-2 text-primary-foreground font-semibold hover:bg-secondary transition-colors ${
							disabled ? "opacity-50 cursor-not-allowed" : ""
						}`}>
						Search
					</button>
				</div>
			</form>
		</div>
	);
}
