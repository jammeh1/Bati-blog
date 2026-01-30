import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Image as ImageType } from "@/shared/types";
import {
	Upload,
	Trash2,
	Copy,
	Check,
	Loader2,
	Image as ImageIcon,
	X,
	Search,
} from "lucide-react";
import { toast } from "sonner";

const MediaLibrary: React.FC = () => {
	const [images, setImages] = useState<ImageType[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [imageToDelete, setImageToDelete] = useState<ImageType | null>(null);
	const [deleting, setDeleting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchImages();
	}, []);

	const fetchImages = async () => {
		try {
			const { data, error } = await supabase
				.from("images")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			setImages(data || []);
		} catch (err) {
			console.error("Error fetching images:", err);
			toast.error("Failed to load images");
		} finally {
			setLoading(false);
		}
	};

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		const uploadedImages: ImageType[] = [];

		try {
			for (const file of Array.from(files)) {
				if (!file.type.startsWith("image/")) {
					toast.error(`${file.name} is not an image`);
					continue;
				}

				const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

				const { data: uploadData, error: uploadError } = await supabase.storage
					.from("blog-images")
					.upload(fileName, file);

				if (uploadError) {
					console.error("Upload error:", uploadError);
					toast.error(`Failed to upload ${file.name}`);
					continue;
				}

				const { data: urlData } = supabase.storage
					.from("blog-images")
					.getPublicUrl(fileName);

				const imageRecord = {
					name: file.name,
					url: urlData.publicUrl,
					path: fileName, // This matches the column the error was complaining about
					alt_text: file.name.replace(/\.[^/.]+$/, ""),
					size: file.size,
					mime_type: file.type,
					folder: "general",
				};

				const { data: insertData, error: insertError } = await supabase
					.from("images")
					.insert(imageRecord)
					.select() // This fetches id and created_at back from the DB
					.single();

				if (insertError) {
					console.error("Insert error:", insertError);
					continue;
				}

				uploadedImages.push(insertData);
			}

			if (uploadedImages.length > 0) {
				setImages([...uploadedImages, ...images]);
				toast.success(
					`${uploadedImages.length} image(s) uploaded successfully`,
				);
			}
		} catch (err) {
			console.error("Error uploading:", err);
			toast.error("Upload failed");
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleCopyUrl = async (url: string, id: string) => {
		await navigator.clipboard.writeText(url);
		setCopiedId(id);
		toast.success("URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleDelete = async () => {
		if (!imageToDelete) return;

		setDeleting(true);
		try {
			// Extract filename from URL
			const urlParts = imageToDelete.url.split("/");
			const fileName = urlParts[urlParts.length - 1];

			// Delete from storage
			await supabase.storage.from("blog-images").remove([fileName]);

			// Delete from database
			const { error } = await supabase
				.from("images")
				.delete()
				.eq("id", imageToDelete.id);

			if (error) throw error;

			setImages(images.filter((img) => img.id !== imageToDelete.id));
			toast.success("Image deleted successfully");
			setDeleteModalOpen(false);
			setImageToDelete(null);
			setSelectedImage(null);
		} catch (err) {
			console.error("Error deleting image:", err);
			toast.error("Failed to delete image");
		} finally {
			setDeleting(false);
		}
	};

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown";
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const filteredImages = images.filter(
		(img) =>
			img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			img.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
			</div>
		);
	}

	return (
		<div className="p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-[#1A1A2E]">Media Library</h1>
					<p className="text-gray-500 mt-1">{images.length} images</p>
				</div>
				<div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleUpload}
						className="hidden"
						id="image-upload"
					/>
					<label
						htmlFor="image-upload"
						className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-medium rounded-lg transition-colors cursor-pointer ${
							uploading ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{uploading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<Upload className="w-5 h-5" />
						)}
						Upload Images
					</label>
				</div>
			</div>

			{/* Search */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search images..."
						className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
					/>
				</div>
			</div>

			{/* Images Grid */}
			{filteredImages.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
					<ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<p className="text-gray-500 text-lg">No images found</p>
					<p className="text-gray-400 text-sm mt-1">
						{searchQuery
							? "Try a different search term"
							: "Upload your first image to get started"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{filteredImages.map((image) => (
						<div
							key={image.id}
							onClick={() => setSelectedImage(image)}
							className={`group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
								selectedImage?.id === image.id
									? "border-[#FF6B35]"
									: "border-gray-100"
							}`}
						>
							<img
								src={image.url}
								alt={image.alt_text || image.name}
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
								<div className="flex gap-2">
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleCopyUrl(image.url, image.id);
										}}
										className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
										title="Copy URL"
									>
										{copiedId === image.id ? (
											<Check className="w-4 h-4 text-green-500" />
										) : (
											<Copy className="w-4 h-4" />
										)}
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setImageToDelete(image);
											setDeleteModalOpen(true);
										}}
										className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
										title="Delete"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Image Detail Sidebar */}
			{selectedImage && (
				<div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 overflow-y-auto">
					<div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
						<h3 className="font-semibold text-[#1A1A2E]">Image Details</h3>
						<button
							onClick={() => setSelectedImage(null)}
							className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
					<div className="p-4">
						<img
							src={selectedImage.url}
							alt={selectedImage.alt_text || selectedImage.name}
							className="w-full aspect-video object-cover rounded-lg mb-4"
						/>
						<div className="space-y-4">
							<div>
								<label className="block text-xs font-medium text-gray-500 mb-1">
									Name
								</label>
								<p className="text-sm text-[#1A1A2E] break-all">
									{selectedImage.name}
								</p>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-500 mb-1">
									Size
								</label>
								<p className="text-sm text-[#1A1A2E]">
									{formatFileSize(selectedImage.size)}
								</p>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-500 mb-1">
									Type
								</label>
								<p className="text-sm text-[#1A1A2E]">
									{selectedImage.mime_type || "Unknown"}
								</p>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-500 mb-1">
									Uploaded
								</label>
								<p className="text-sm text-[#1A1A2E]">
									{formatDate(selectedImage.created_at)}
								</p>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-500 mb-1">
									URL
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={selectedImage.url}
										readOnly
										className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50"
									/>
									<button
										onClick={() =>
											handleCopyUrl(selectedImage.url, selectedImage.id)
										}
										className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
									>
										{copiedId === selectedImage.id ? (
											<Check className="w-4 h-4 text-green-500" />
										) : (
											<Copy className="w-4 h-4 text-gray-500" />
										)}
									</button>
								</div>
							</div>
							<button
								onClick={() => {
									setImageToDelete(selectedImage);
									setDeleteModalOpen(true);
								}}
								className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
								Delete Image
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Modal */}
			{deleteModalOpen && imageToDelete && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl max-w-md w-full p-6">
						<h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">
							Delete Image
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete "{imageToDelete.name}"? This
							action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => {
									setDeleteModalOpen(false);
									setImageToDelete(null);
								}}
								className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								disabled={deleting}
								className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
							>
								{deleting && <Loader2 className="w-4 h-4 animate-spin" />}
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MediaLibrary;
