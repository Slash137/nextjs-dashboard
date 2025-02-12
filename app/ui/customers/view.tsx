'use client';

import { CustomerField, InvoiceForm } from '@/app/lib/definitions';
import {
  UserCircleIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image'
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';

export default function ViewCustomerForm({
  customer,
}: {
  customer: CustomerField[];
}) {


  return (
    <div className="w-full flex items-center flex-col lg:block lg:max-w-full">
      <div className="w-full flex justify-center lg:hidden">
        <div className='w-full flex flex-col items-end justify-center'>
          <div className='w-full mx-auto bg-white rounded-lg'>
            <div className="rounded-lg bg-gray-50 pt-4">
              <div className="text-center">
                <span className="border-4 border-white rounded-full mx-auto inline-block">
                  <Image
                    src={customer.image_url}
                    className="rounded-full"
                    alt={`${customer.name}'s profile picture`}
                    width={100}
                    height={100}
                  />
                </span>
                <p className="text-center"><span className="font-bold text-center">{customer.name}</span></p>
                <p className="text-xs text-center mb-5 text-gray-400">{customer.email}</p>
              </div>
              <div className="flex justify-around items-center text-center px-10 pt-2 pb-7">
                <div className="text-center">
                  <p className="font-bold text-gray-600">Total Pending</p>
                  <p className="text-xs text-gray-400">{customer.total_pending}</p>
                </div>
                {/* <div className="text-center">
                  <p className="font-bold">{customer.total_invoices}</p>
                  <p className="text-xs">Total Invoices</p>
                </div> */}
                <div className="text-center">
                  <p className="font-bold text-gray-600">Total Paid</p>
                  <p className="text-xs text-gray-400">{customer.total_paid}</p>
                </div>
              </div>
              <hr />
              <div>
                <p className="px-6 py-4 text-sm text-gray-500">{customer.total_invoices} invoices</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* <!-- User Profile Tab Card --> */}
      <div className="hidden lg:flex flex-col items-start rounded-lg bg-gray-50 p-6">
        <div className="flex items-center">
          {/* <!-- Avaar Container --> */}
          <div className="flex justify-center" style={{ minWidth: "150px", minHeight: "100px" }}>
            {/* <!-- User Avatar --> */}
            <Image
              src={customer.image_url}
              className="rounded-full"
              alt={`${customer.name}'s profile picture`}
              width={100}
              height={100}
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* <!-- Meta Body --> */}
          <div className="flex flex-col px-6">
            {/* <!-- Username Container --> */}
            <div className="flex h-8 flex-row">
              {/* <!-- Username --> */}
              <div>
                <h2 className="text-lg font-semibold">{customer.name}</h2>
              </div>
            </div>

            {/* <!-- Meta Badges --> */}
            <div className="mb-2 flex flex-row space-x-2">

              {/* <!-- Badge Email--> */}
              <div className="flex flex-row">
                <div className="text-sm text-gray-400">{customer.email}</div>
              </div>
            </div>

            {/* <!-- Mini Cards --> */}
            <div className="mt-2 flex flex-row items-start justify-start space-x-5">
              {/* <!-- Comments --> */}
              {/* <div
              className="flex h-20 w-40 flex-col items-center justify-center rounded-lg transition-colors duration-100 ease-in-out hover:border-gray-400/80">
              <div className="flex flex-row items-center justify-center">

                <span className="font-bold text-gray-600">{customer.total_invoices}</span>
              </div>

              <div className="mt-2 text-sm text-gray-400">Invoices</div>
            </div>

            <div style={{borderLeft: "1px solid #c6c6c6", height:"50px"}}></div> */}

              {/* <!-- Projects --> */}
              <div
                className="flex h-20 mr-10 flex-col items-center justify-center rounded-lg">
                <div className="flex flex-row items-center justify-center">

                  <span className="font-bold text-gray-600">Total Pending</span>
                </div>

                <div className="mt-2 text-sm text-gray-400">{customer.total_pending}</div>
              </div>

              {/* <!-- Projects --> */}
              <div
                className="flex h-20 flex-col items-center justify-center rounded-lg">
                <div className="flex flex-row items-center justify-center">

                  <span className="font-bold text-gray-600">Total Paid</span>
                </div>

                <div className="mt-2 text-sm text-gray-400">{customer.total_paid}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full mt-4">
          <hr />
          <p className="px-6 pt-5 text-sm text-gray-400">{customer.total_invoices} invoices</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href={`/dashboard/customers`}
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          View customers
        </Link>
        <Link
          href={`/dashboard/customers/${customer.id}/edit`}
          className="flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400"
        >
          Edit customer
        </Link>
      </div>

    </div>

  );
}
