import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/shared/Header";
import Footer from "@/shared/Footer";
import PostCard from "./PostCard";
import { Post } from "@/shared/types";
import { supabase } from "@/lib/supabase";
import {
	Calendar,
	Clock,
	Eye,
	User,
	ArrowLeft,
	Share2,
	Facebook,
	Twitter,
	Linkedin,
	Loader2,
	Copy,
	Check,
} from "lucide-react";

const PostDetail: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const [post, setPost] = useState<Post | null>(null);
	const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (slug) {
			fetchPost();
		}
	}, [slug]);

	const fetchPost = async () => {
		setLoading(true);
		try {
			// Fetch post
			const { data, error } = await supabase
				.from("posts")
				.select("*, categories(name, slug)")
				.eq("slug", slug)
				.eq("status", "published")
				.single();

			if (error) throw error;
			setPost(data);

			// Increment views
			await supabase
				.from("posts")
				.update({ views: (data.views || 0) + 1 })
				.eq("id", data.id);

			// Fetch related posts
			if (data.category_id) {
				const { data: related } = await supabase
					.from("posts")
					.select("*, categories(name, slug)")
					.eq("status", "published")
					.eq("category_id", data.category_id)
					.neq("id", data.id)
					.order("published_at", { ascending: false })
					.limit(3);

				setRelatedPosts(related || []);
			}
		} catch (err) {
			console.error("Error fetching post:", err);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return "";
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	const shareUrl = window.location.href;
	const shareTitle = post?.title || "";

	const handleCopyLink = async () => {
		await navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const shareLinks = {
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
		twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FAFAFA]">
				<Header />
				<div className="flex items-center justify-center py-40">
					<Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
				</div>
				<Footer />
			</div>
		);
	}

	if (!post) {
		return (
			<div className="min-h-screen bg-[#FAFAFA]">
				<Header />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
					<h1 className="text-2xl font-bold text-[#1A1A2E] mb-4">
						Post Not Found
					</h1>
					<p className="text-gray-600 mb-8">
						The post you're looking for doesn't exist or has been removed.
					</p>
					<Link
						to="/"
						className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E55A2B] transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Blog
					</Link>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FAFAFA]">
			<Header />

			{/* Hero Image */}
			<div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
				<img
					src={
						post.featured_image ||
						"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200"
					}
					alt={post.title}
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
					<div className="max-w-4xl mx-auto">
						<Link
							to="/"
							className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Blog
						</Link>
						{post.categories && (
							<Link
								to={`/category/${post.categories.slug}`}
								className="inline-block px-3 py-1 bg-[#FF6B35] text-white text-sm font-medium rounded-full mb-4 ml-4"
							>
								{post.categories.name}
							</Link>
						)}
						<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
							{post.title}
						</h1>
						<div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
							<span className="flex items-center gap-2">
								<User className="w-4 h-4" />
								{post.author}
							</span>
							<span className="flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								{formatDate(post.published_at)}
							</span>
							<span className="flex items-center gap-2">
								<Clock className="w-4 h-4" />
								{post.read_time} min read
							</span>
							<span className="flex items-center gap-2">
								<Eye className="w-4 h-4" />
								{post.views} views
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
					{/* Share Buttons */}
					<div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
						<span className="flex items-center gap-2 text-gray-500 text-sm">
							<Share2 className="w-4 h-4" />
							Share:
						</span>
						<a
							href={shareLinks.facebook}
							target="_blank"
							rel="noopener noreferrer"
							className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
						>
							<Facebook className="w-4 h-4" />
						</a>
						<a
							href={shareLinks.twitter}
							target="_blank"
							rel="noopener noreferrer"
							className="w-9 h-9 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center justify-center transition-colors"
						>
							<Twitter className="w-4 h-4" />
						</a>
						<a
							href={shareLinks.linkedin}
							target="_blank"
							rel="noopener noreferrer"
							className="w-9 h-9 bg-blue-700 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center transition-colors"
						>
							<Linkedin className="w-4 h-4" />
						</a>
						<button
							onClick={handleCopyLink}
							className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
						>
							{copied ? (
								<Check className="w-4 h-4 text-green-500" />
							) : (
								<Copy className="w-4 h-4" />
							)}
						</button>
					</div>

					{/* Post Content */}
					<div
						className="prose prose-lg max-w-none prose-headings:text-[#1A1A2E] prose-a:text-[#FF6B35] prose-a:no-underline hover:prose-a:underline"
						dangerouslySetInnerHTML={{ __html: post.content }}
					/>

					{/* Tags / Category */}
					<div className="mt-12 pt-8 border-t border-gray-100">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-gray-500 text-sm">Category:</span>
							{post.categories && (
								<Link
									to={`/category/${post.categories.slug}`}
									className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium rounded-full hover:bg-[#FF6B35]/20 transition-colors"
								>
									{post.categories.name}
								</Link>
							)}
						</div>
					</div>
				</div>

				{/* Author Card */}
				<div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] rounded-full flex items-center justify-center">
							<span className="text-white font-bold text-xl">BN</span>
						</div>
						<div>
							<h3 className="font-semibold text-[#1A1A2E]">{post.author}</h3>
							<p className="text-gray-500 text-sm">Bati Ngalun Team</p>
						</div>
					</div>
					<p className="mt-4 text-gray-600 text-sm">
						Building excellence in The Gambia & the sub-region since day one.
						Our team shares insights, tips, and project updates to help you
						achieve your construction dreams.
					</p>
				</div>
			</article>

			{/* Related Posts */}
			{relatedPosts.length > 0 && (
				<section className="bg-white py-16">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<h2 className="text-2xl font-bold text-[#1A1A2E] mb-8">
							Related Posts
						</h2>
						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{relatedPosts.map((relatedPost) => (
								<PostCard key={relatedPost.id} post={relatedPost} />
							))}
						</div>
					</div>
				</section>
			)}

			<Footer />
		</div>
	);
};

export default PostDetail;
