'use client';

import { useState } from 'react';
import { useClient } from '@/context/ClientContext';
import { Button } from '@/components/Buttons/Button';
import { X, UserPlus } from 'lucide-react';
import { clientDriverRegister } from "@lib/driverApi";
import { EClientType } from "@constants";
import { useRouter } from "next/navigation";

interface DriverRegisterFormProps {
	handleClose: () => void;
	onSwitchToLogin: () => void;
}

export default function DriverRegisterForm({
	handleClose,
	onSwitchToLogin,
}: DriverRegisterFormProps) {
	const { updateClient } = useClient();
	const router = useRouter();
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [city, setCity] = useState('');
	const [carModel, setCarModel] = useState('');
	const [carPlate, setCarPlate] = useState('');
	const [carYear, setCarYear] = useState(String(new Date().getFullYear()));
	const [carColor, setCarColor] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		const trimmedPassword = password.trim();
		const trimmedPhone = phone.trim();
		const trimmedEmail = email.trim();
		const trimmedCity = city.trim();
		const trimmedCarModel = carModel.trim();
		const trimmedCarPlate = carPlate.trim();
		const trimmedCarColor = carColor.trim();
		const year = parseInt(carYear, 10);
		if (!trimmedName) {
			setError('Enter your name');
			return;
		}
		if (!trimmedPassword) {
			setError('Enter a password');
			return;
		}
		if (!trimmedPhone) {
			setError('Enter your phone');
			return;
		}
		if (!trimmedEmail) {
			setError('Enter your email');
			return;
		}
		if (!trimmedCity) {
			setError('Enter your city');
			return;
		}
		if (!trimmedCarModel || !trimmedCarPlate || !trimmedCarColor) {
			setError('Enter car model, plate and color');
			return;
		}
		if (Number.isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
			setError('Enter a valid car year');
			return;
		}
		setError('');
		setLoading(true);
		try {
			const { driverId: newId } = await clientDriverRegister({
				name: trimmedName,
				password: trimmedPassword,
				phone: trimmedPhone,
				email: trimmedEmail,
				city: trimmedCity,
				car: {
					model: trimmedCarModel,
					plate: trimmedCarPlate,
					year,
					color: trimmedCarColor,
				},
			});
			updateClient(EClientType.DRIVER, newId);
			if (typeof window !== 'undefined') window.sessionStorage.setItem('driverId', newId);
			handleClose();
			router.push('/drivers');
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Registration failed',
			);
		} finally {
			setLoading(false);
		}
	};

	const inputClass =
		"w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#964edd] focus:outline-none focus:ring-1 focus:ring-[#964edd]";
	const labelClass = "text-xs font-medium text-slate-600";

	return (
		<>
			<p className="text-sm text-gray-500 mb-4">
				Create your driver account. All fields including city and car are required.
			</p>
			<form onSubmit={handleSubmit} className="grid overflow-y-auto grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
				<div className="flex flex-col gap-1">
					<label htmlFor="driverName" className={labelClass}>Name</label>
					<input
						id="driverName"
						type="text"
						value={name}
						onChange={(e) => { setName(e.target.value); setError(""); }}
						placeholder="Name"
						className={inputClass}
						disabled={loading}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="driverPasswordRegister" className={labelClass}>Password</label>
					<input
						id="driverPasswordRegister"
						type="password"
						value={password}
						onChange={(e) => { setPassword(e.target.value); setError(""); }}
						placeholder="Password"
						className={inputClass}
						disabled={loading}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="driverPhone" className={labelClass}>Phone</label>
					<input
						id="driverPhone"
						type="tel"
						value={phone}
						onChange={(e) => { setPhone(e.target.value); setError(""); }}
						placeholder="Phone"
						className={inputClass}
						disabled={loading}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="driverEmail" className={labelClass}>Email</label>
					<input
						id="driverEmail"
						type="email"
						value={email}
						onChange={(e) => { setEmail(e.target.value); setError(""); }}
						placeholder="Email"
						className={inputClass}
						disabled={loading}
					/>
				</div>
				<div className="flex flex-col gap-1 md:col-span-2">
					<label htmlFor="driverCity" className={labelClass}>City (required)</label>
					<input
						id="driverCity"
						type="text"
						value={city}
						onChange={(e) => { setCity(e.target.value); setError(""); }}
						placeholder="City"
						required
						minLength={1}
						className={inputClass}
						disabled={loading}
					/>
				</div>
				<div className="flex flex-col gap-1 md:col-span-2">
					<p className={labelClass}>Car (required: model, plate, year, color)</p>
					<div className="grid grid-cols-2 gap-2">
						<input
							id="carModel"
							type="text"
							value={carModel}
							onChange={(e) => { setCarModel(e.target.value); setError(""); }}
							placeholder="Car model"
							required
							minLength={1}
							className={inputClass}
							disabled={loading}
						/>
						<input
							id="carPlate"
							type="text"
							value={carPlate}
							onChange={(e) => { setCarPlate(e.target.value); setError(""); }}
							placeholder="Plate"
							required
							minLength={1}
							className={inputClass}
							disabled={loading}
						/>
						<input
							id="carYear"
							type="number"
							value={carYear}
							onChange={(e) => { setCarYear(e.target.value); setError(""); }}
							placeholder="Year"
							required
							min={1990}
							max={new Date().getFullYear() + 1}
							className={inputClass}
							disabled={loading}
						/>
						<input
							id="carColor"
							type="text"
							value={carColor}
							onChange={(e) => { setCarColor(e.target.value); setError(""); }}
							placeholder="Car color"
							required
							minLength={1}
							className={inputClass}
							disabled={loading}
						/>
					</div>
				</div>
				{error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
				<div className="flex flex-wrap gap-2 pt-2 w-full md:flex-nowrap md:col-span-2">
					<Button
						type="submit"
						color="secondary"
						text={loading ? 'Creating…' : 'Register'}
						icon={<UserPlus />}
						className="w-full md:w-auto"
					/>
					<Button
						type="button"
						color="ghost"
						text="Cancel"
						onClick={handleClose}
						icon={<X />}
						className="w-full md:w-auto"
					/>
				</div>
			</form>
			<button
				type="button"
				onClick={onSwitchToLogin}
				className="mt-4 text-sm text-[#964edd] hover:underline"
			>
				Already have an account? Log in
			</button>
		</>
	);
}
