"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Signature, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileForm } from "../profile/profile-form";
import { PhotoUpload } from "../profile/photo-upload";
import { SignatureUpload } from "../profile/signature-upload";
import { NotificationSettings } from "./notification-settings";
import { SecuritySettings } from "./security-settings";

type User = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  profilePhotoPath: string | null;
  signaturePath: string | null;
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "signature", label: "Signature", icon: Signature },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export function SettingsTabs({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  return (
    <div>
      {/* Tab navigation */}
      <div className="mb-8 flex gap-1 border-b border-slate-200 bg-white/50 p-1 rounded-xl">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/doctor/settings?tab=${tab.id}`}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-700 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="card p-7">
              <PhotoUpload
                name={user.name}
                photoUrl={user.profilePhotoPath ? "/api/doctor/profile/photo" : null}
              />
              <div className="mt-4">
                <ProfileForm />
              </div>
            </div>
          </div>
        )}

        {activeTab === "signature" && (
          <div className="card p-7">
            <SignatureUpload
              signatureUrl={user.signaturePath ? "/api/doctor/profile/signature" : null}
            />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="card p-7">
            <NotificationSettings />
          </div>
        )}

        {activeTab === "security" && (
          <div className="card p-7">
            <SecuritySettings />
          </div>
        )}
      </div>
    </div>
  );
}