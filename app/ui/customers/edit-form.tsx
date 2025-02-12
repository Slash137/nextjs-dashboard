'use client';

import { CustomerField, InvoiceForm } from '@/app/lib/definitions';
import {
  UserCircleIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image'
import { Button } from '@/app/ui/button';
import { updateCustomer, State } from '@/app/lib/customers/actions';
import { useActionState } from 'react';

export default function EditCustomerForm({
  customer,
}: {
  customer: CustomerField[];
}) {
  
  const initialState: State = { message: null, errors: {} };
  const updateCustomerWithId = updateCustomer.bind(null, customer.id);
  const [state, formAction] = useActionState(updateCustomerWithId, initialState);

  return (
    <form action={formAction}>
    {/* <form> */}
      <div className="rounded-md bg-gray-50 p-4 md:p-6 flex flex-col items-center basis-full justify-around">
        <p className="mt-2 mb-4 font-bold text-red-500 underline" key={state.message}>
          {state.message}
        </p>


        <div className="flex items-center m-4">
          <Image
            src={customer.image_url}
            className="rounded-full"
            alt={`${customer.name}'s profile picture`}
            width={100}
            height={100}
          />
        </div>
 
        <div className="px-2 w-full max-w-[75%] lg:max-w-[50%] xl:max-w-[30%] 2xl:max-w-[20%]">
          {/* Customer Name */}
          <div className="my-4 w-full">
            <label htmlFor="customer" className="mb-2 block text-sm font-medium">
              Customer Name
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={customer.name}
                  placeholder="Enter customer name"
                  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                />
                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
            <div id="customer-error" aria-live="polite" aria-atomic="true">
              {state.errors?.name &&
                state.errors.name.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* Invoice Amount */}
          <div className="my-4 w-full">
            <label htmlFor="amount" className="mb-2 block text-sm font-medium">
              Customer email
            </label>
            <div className="relative mt-2 rounded-md">
              <div className="relative">
                <input
                    id="email"
                    name="email"
                    type="text"
                    defaultValue={customer.email}
                    placeholder="Enter customer email"
                    className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              <div id="amount-error" aria-live="polite" aria-atomic="true">
                {state.errors?.email &&
                  state.errors.email.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>
          </div>

        </div>

      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href={`/dashboard/customers/${customer.id}`}
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Save customer</Button>
      </div>
    </form>
  );
}
