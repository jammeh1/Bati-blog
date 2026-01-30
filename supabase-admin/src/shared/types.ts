// Type definitions for the blog system

export interface Category {
	id: string;
	name: string;
	slug: string;
	description?: string;
	created_at: string;
}

export interface Post {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	content: string;
	featured_image?: string;
	category_id?: string;
	categories?: Category;
	author: string;
	status: "draft" | "published" | "scheduled";
	published_at?: string;
	read_time: number;
	views: number;
	created_at: string;
	updated_at: string;
}

export interface Image {
	id: string;
	name: string;
	url: string;
	path: string; // Add this to match the DB column
	alt_text?: string;
	size?: number;
	mime_type?: string;
	folder: string;
	created_at: string;
}

export interface BlogStats {
	totalPosts: number;
	totalViews: number;
	totalCategories: number;
}
