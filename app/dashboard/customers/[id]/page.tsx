import View from '@/app/ui/customers/view';
import Breadcrumbs from '@/app/ui/assets/breadcrumbs';
import { fetchCustomerById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'View Customer',
}
 
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const customer = await Promise.all([
    fetchCustomerById(id),
  ])

  if (!customer) {
    notFound();
  }
  
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'View customer',
            href: `/dashboard/customer/${id}`,
            active: true,
          },
        ]}
      />


      <View customer={customer[0]} />

    </main>
  );
}