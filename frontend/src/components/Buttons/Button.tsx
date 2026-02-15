import { cn } from "@/lib/utils";

interface ButtonProps {
	color: "primary" | "secondary";
	text: string;
	icon: React.ReactNode;
	onClick?: (value?: unknown) => void;
	className?: string;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
}

export const Button = ({ color, text, icon, onClick, className, type = 'button', disabled }: ButtonProps) => {
	const colorClass = {
		primary: "bg-[#964edd] text-white hover:bg-white hover:border-solid border-2 border-[#964edd] hover:text-[#964edd]",
		secondary: "bg-[#79c145] text-white hover:bg-white hover:border-solid border-2 border-[#79c145] hover:text-[#79c145]",
	};

	return (
		<button
			className={cn(
				colorClass[color],
				className,
				"flex h-12 w-auto shadow-sm text-nowrap :mobile:w-full items-center justify-center gap-2 rounded-lg px-5 transition-colors hover:shadow hover:cursor-pointer",
				disabled && "opacity-50 cursor-not-allowed pointer-events-none",
			)}
			type={type}
			onClick={onClick}
			disabled={disabled}
		>
			{icon}
			{text}
		</button>
	);
};
