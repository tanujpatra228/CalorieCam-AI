import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { redirect } from 'next/navigation'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param type - The type of message, either 'error' or 'success'.
 * @param path - The path to redirect to.
 * @param message - The message to be encoded and added as a query parameter.
 * @returns This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
	type: 'error' | 'success',
	path: string,
	message: string,
) {
	return redirect(`${path}?${type}=${encodeURIComponent(message)}`)
}
