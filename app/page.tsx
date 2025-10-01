import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect to public home page
  redirect('/home')
}