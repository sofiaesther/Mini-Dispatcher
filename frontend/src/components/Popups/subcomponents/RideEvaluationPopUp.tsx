'use client';

import { useState, useCallback } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@components/Buttons/Button';
import { STARS } from '@constants';

interface RideEvaluationPopUpProps {
	handleClose: () => void;
	onSubmit: (rating: number, comment?: string) => void;
}

export default function RideEvaluationPopUp({ handleClose, onSubmit }: RideEvaluationPopUpProps) {
	const [rating, setRating] = useState<number>(0);
	const [hoverRating, setHoverRating] = useState<number>(0);
	const [comment, setComment] = useState('');

	const displayRating = hoverRating || rating;

	const handleSubmit = useCallback(() => {
		if (rating >= 1 && rating <= 5) {
			onSubmit(rating, comment.trim() || undefined);
		}
		handleClose();
	}, [rating, comment, onSubmit, handleClose]);

	return (
		<div className="flex flex-col p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-lg font-semibold text-gray-900">Rate your ride</h2>
				<button
					type="button"
					onClick={handleClose}
					className="p-1 rounded hover:bg-gray-100 text-gray-500"
					aria-label="Close"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			<p className="text-sm text-gray-600 mb-4">How was your experience? From 0 to 5 stars.</p>

			<div className="flex items-center gap-1 mb-6" role="group" aria-label="Rate in stars">
				{STARS.map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => setRating(value)}
						onMouseEnter={() => setHoverRating(value)}
						onMouseLeave={() => setHoverRating(0)}
						className="p-1 rounded hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
						aria-label={`${value} star${value > 1 ? 's' : ''}`}
					>
						<Star
							className={`h-10 w-10 transition-colors ${
								value <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
							}`}
						/>
					</button>
				))}
			</div>

			<label htmlFor="ride-eval-comment" className="block text-sm font-medium text-gray-700 mb-2">
				Message (optional)
			</label>
			<textarea
				id="ride-eval-comment"
				value={comment}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
				placeholder="Leave a comment..."
				rows={3}
				className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#964edd] focus:outline-none focus:ring-1 focus:ring-[#964edd] resize-none"
			/>

			<div className="flex gap-3 mt-6">
				<Button
					type="button"
					color="ghost"
					text="Close"
					icon={<X className="h-4 w-4" />}
					onClick={handleClose}
				/>
				<Button
					type="button"
					color="primary"
				    text="Submit rating"
					icon={<Star className="h-4 w-4" />}
					onClick={handleSubmit}
					disabled={rating < 1}
				/>
			</div>
		</div>
	);
}
