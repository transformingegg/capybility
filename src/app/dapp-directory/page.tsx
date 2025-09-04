"use client";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import MainLayout from "@/components/MainLayout";
import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { FaXTwitter, FaTelegram, FaDiscord } from "react-icons/fa6";

// Helper to format app name for URL
const formatAppNameForUrl = (name: string) => name.replace(/\s+/g, "_").replace(/[^\w_]/g, "");

// Helper to get expanded app from URL
const getExpandedAppFromUrl = (searchParams: ReadonlyURLSearchParams | null) => {
  if (!searchParams) {
    return "";
  }
  return searchParams.get("expand") || "";
};

// Fetch DApp data from API route
async function fetchDappJsons() {
  const res = await fetch("/api/dapp-directory");
  if (!res.ok) return [];
  return await res.json();
}

// Types for Dapp and SocialLink
interface SocialLinkType {
  URL: string;
  Platform: string;
}
interface DappType {
  App_Name: string;
  Link_to_Main_Site: string;
  App_Blurb?: string;
  Features?: string[];
  Season_3_Yuzu_Allocation_Amount?: string;
  Ways_to_Get_Yuzu_from_DApp_Use?: string[];
  Social_Links?: SocialLinkType[];
  Link_to_Best_YUZU_Information_about_this_DApp?: string;
  Extra_Important_Information_Link_1?: { URL: string; Link_Title: string };
  Extra_Important_Information_Link_2?: { URL: string; Link_Title: string };
}

const DappDirectoryPage = () => {
  const [dapps, setDapps] = useState<DappType[]>([]);
  const [expanded, setExpanded] = useState<string>("");
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});
  // Favicon index state per DApp
  const [faviconIdxMap, setFaviconIdxMap] = useState<{ [key: string]: number }>({});
  const { address } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchDappJsons().then(setDapps);
  }, []);

  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`dappChecked_${address}`);
      if (saved) setChecked(JSON.parse(saved));
    }
  }, [address]);

  useEffect(() => {
    const expandApp = getExpandedAppFromUrl(searchParams);
    setExpanded(expandApp);
  }, [searchParams]);

  useEffect(() => {
    if (address) {
      localStorage.setItem(`dappChecked_${address}`, JSON.stringify(checked));
    }
  }, [checked, address]);

  const handleExpand = (appName: string) => {
    setExpanded(appName);
    router.replace(`?expand=${appName}`);
  };

  const handleCollapse = () => {
    setExpanded("");
    router.replace("?");
  };

  const handleCheck = (appName: string) => {
    setChecked((prev) => ({ ...prev, [appName]: !prev[appName] }));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <Card className="mb-8 relative shadow-primary rounded-xl border border-primary bg-card">
          <CardHeader className="flex flex-col items-start p-6">
            <CardTitle className="text-3xl font-bold text-primary mb-2">EDUCHAIN DApp Directory</CardTitle>
            <div className="mb-2 text-lg text-gray-700">Our aim is to create the most informative and <span className="font-bold text-primary">BEST Educhain App directory</span> and keep it up to date! Want to know how to earn <span className="font-bold text-yellow-500">Season 3 YUZU</span>? This is your place.</div>
            <div className="mb-2 text-lg text-gray-700">Use the checkboxes to track whether or not you have investigated the DApp.</div>
            <div className="mb-2 text-lg text-gray-700">Use the drop down arrows to access each DApps information.</div>
          </CardHeader>
        </Card>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-xl shadow-lg bg-card border border-primary border-collapse">
            <thead>
              <tr className="bg-gradient-to-b from-primary/10 to-card border-t border-b border-primary">
                <th className="px-4 py-3 text-left text-primary font-bold rounded-tl-xl border border-primary">Dapp Name</th>
                <th className="px-4 py-3 text-left text-primary font-bold border border-primary">Dapp Link</th>
                {address && <th className="px-4 py-3 text-left text-primary font-bold border border-primary">Checked</th>}
                <th className="px-4 py-3 rounded-tr-xl border border-primary"></th>
              </tr>
            </thead>
            <tbody>
              {dapps.map((dapp) => {
                const appName = dapp.App_Name;
                const appUrl = formatAppNameForUrl(appName);
                const isExpanded = expanded === appUrl;
                // Favicon index for this DApp
                const faviconTypes = [".ico", ".png", ".svg"];
                const faviconIdx = faviconIdxMap[appUrl] ?? 0;
                let faviconUrl = "";
                try {
                  const url = new URL(dapp.Link_to_Main_Site);
                  faviconUrl = url.origin + "/favicon" + faviconTypes[faviconIdx];
                } catch {
                  faviconUrl = "";
                }
                const handleFaviconError = () => {
                  if (faviconIdx < faviconTypes.length - 1) {
                    setFaviconIdxMap(prev => ({ ...prev, [appUrl]: faviconIdx + 1 }));
                  }
                };
                return (
                  <React.Fragment key={appUrl}>
                    <tr className={`last:border-b-0 bg-card hover:bg-primary/10 transition`}>
                      <td className="px-4 py-3 font-semibold text-gray-900 border border-primary">{appName}</td>
                        <td className="px-4 py-3 border border-primary">
                          <a
                            href={dapp.Link_to_Main_Site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-500 underline break-all hover:text-yellow-400"
                          >
                            {(() => {
                              try {
                                const url = new URL(dapp.Link_to_Main_Site);
                                return url.origin + '/';
                              } catch {
                                return dapp.Link_to_Main_Site;
                              }
                            })()}
                          </a>
                        </td>
                      {address && (
                        <td className="px-4 py-3 border border-primary">
                          <input
                            type="checkbox"
                            checked={!!checked[appUrl]}
                            onChange={() => handleCheck(appUrl)}
                            className="accent-primary w-5 h-5 rounded focus:ring-2 focus:ring-primary"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-right border border-primary">
                        <button
                          className="text-primary hover:text-primary/80 transition"
                          onClick={() => (isExpanded ? handleCollapse() : handleExpand(appUrl))}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td className="border border-primary bg-card" colSpan={address ? 4 : 3} style={{ padding: 0 }}>
                          <table className="w-full">
                            <tbody>
                              <tr>
                                <td className="px-6 py-6 rounded-b-xl shadow-inner border-none bg-card relative" colSpan={address ? 4 : 3}>
                                  {/* Favicon top right: tries .ico, .png, .svg using React state */}
                                  {faviconUrl && (
                                    <Image
                                      src={faviconUrl}
                                      alt={appName + " favicon"}
                                      width={32}
                                      height={32}
                                      className="absolute top-4 right-4 w-8 h-8 rounded shadow border border-gray-200 bg-white p-1"
                                      style={{ objectFit: "contain" }}
                                      onError={handleFaviconError}
                                      unoptimized
                                    />
                                  )}
                                  <div className="space-y-4">
                                    <div className="text-xl font-bold text-primary mb-2">{appName}</div>
                                    <div className="mb-2">
                                      <span className="font-bold text-gray-700">Dapp Link: </span>
                                      <a
                                        href={dapp.Link_to_Main_Site}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-yellow-500 underline break-all hover:text-yellow-400"
                                      >
                                        {(() => {
                                          try {
                                            const url = new URL(dapp.Link_to_Main_Site);
                                            return url.origin + '/';
                                          } catch {
                                            return dapp.Link_to_Main_Site;
                                          }
                                        })()}
                                      </a>
                                    </div>
                                    <div className="font-bold text-gray-700">App Blurb:</div>
                                    <div className="mb-2 text-gray-800">{dapp.App_Blurb}</div>
                                    <div className="font-bold text-gray-700 mt-2">Features:</div>
                                    <ul className="list-disc ml-6 text-gray-800">
                                      {dapp.Features?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                    </ul>
                                    <div className="font-bold text-gray-700 mt-2">Season 3 Yuzu Allocation:</div>
                                    <div className="mb-2 text-gray-800">{dapp.Season_3_Yuzu_Allocation_Amount}</div>
                                    <div className="font-bold text-gray-700 mt-2">Ways to Get Yuzu:</div>
                                    <ul className="list-disc ml-6 text-gray-800">
                                      {dapp.Ways_to_Get_Yuzu_from_DApp_Use?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                    </ul>
                                    <div className="font-bold text-gray-700 mt-2">Social Links:</div>
                                    <div className="flex gap-4 flex-wrap items-center">
                                        {dapp.Social_Links?.map((s: SocialLinkType, i: number) => {
                                          let icon = null;
                                          const url = s.URL.toLowerCase();
                                          if (url.includes("x.com") || url.includes("twitter.com")) icon = <FaXTwitter className="h-6 w-6 text-gray-500 hover:text-gray-900" />;
                                          else if (url.includes("t.me")) icon = <FaTelegram className="h-6 w-6 text-gray-500 hover:text-gray-900" />;
                                          else if (url.includes("discord")) icon = <FaDiscord className="h-6 w-6 text-gray-500 hover:text-gray-900" />;
                                          return (
                                            <a key={i} href={s.URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                                              {icon ? icon : <span className="font-semibold text-primary">{s.Platform}</span>}
                                            </a>
                                          );
                                        })}
                                    </div>
                                    <div className="font-bold text-gray-700 mt-4">Additional Links:</div>
                                    <div className="flex flex-col gap-2">
                                      {dapp.Link_to_Best_YUZU_Information_about_this_DApp && (
                                        <a href={dapp.Link_to_Best_YUZU_Information_about_this_DApp} target="_blank" rel="noopener noreferrer" className="text-primary underline">Best YUZU Info</a>
                                      )}
                                      {dapp.Extra_Important_Information_Link_1 && (
                                        <a href={dapp.Extra_Important_Information_Link_1.URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">{dapp.Extra_Important_Information_Link_1.Link_Title}</a>
                                      )}
                                      {dapp.Extra_Important_Information_Link_2 && (
                                        <a href={dapp.Extra_Important_Information_Link_2.URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">{dapp.Extra_Important_Information_Link_2.Link_Title}</a>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default DappDirectoryPage;
