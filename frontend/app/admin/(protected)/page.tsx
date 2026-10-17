import { redirect } from 'next/navigation';

/** The admin opens on the enquiries list. */
export default function AdminHome() {
  redirect('/admin/inquiries');
}
