"use client";

/**
 * /dashboard/orders — Customer orders + create new order dialog.
 * AuthGuard with requireCustomer is handled by the parent layout.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";

import { OrdersTable } from "@/components/dashboard/orders-table";
import { OrderForm } from "@/components/dashboard/order-form";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import type { OrderFormValues } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

export default function OrdersPage() {
  const { t } = useTranslation();
  const { addOrder } = useOrders();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  async function handleCreateOrder(data: OrderFormValues & { stripePaymentMethodId?: string; stripeSetupIntentId?: string; stripeCustomerId?: string }) {
    const docId = await addOrder({
      serviceType: data.serviceType,
      weight: data.weight,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      address: data.address,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      stripePaymentMethodId: data.stripePaymentMethodId,
      stripeSetupIntentId: data.stripeSetupIntentId,
      stripeCustomerId: data.stripeCustomerId,
    });
    setDialogOpen(false);
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("client.orders.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("client.orders.description")}
          </p>
        </div>

        {/* New Order Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-button gap-2">
              <Plus className="h-4 w-4" />
              {t("client.orders.newOrder")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-white/[0.06] bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{t("dashboard.orders.createNewOrder")}</DialogTitle>
              <DialogDescription>
                {t("dashboard.orders.createOrderDescription")}
              </DialogDescription>
            </DialogHeader>
            <OrderForm
              onSubmit={handleCreateOrder}
              onCancel={() => setDialogOpen(false)}
              defaultAddress={profile?.address || undefined}
              userEmail={profile?.email || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders Table (customer-filtered) */}
      <OrdersTable />
    </div>
  );
}