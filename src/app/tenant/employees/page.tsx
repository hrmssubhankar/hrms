import { redirect } from 'next/navigation'

/** Permanent redirect — the canonical route is /tenant/employee-management */
export default function EmployeesRedirect() {
  redirect('/tenant/employee-management')
}
