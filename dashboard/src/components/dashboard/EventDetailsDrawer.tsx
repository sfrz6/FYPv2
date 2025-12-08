import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoneypotEvent } from '@/types';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Globe, Server, Network, Info, AlertTriangle, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventDetailsDrawerProps {
  event: HoneypotEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDrawer({ event, open, onOpenChange }: EventDetailsDrawerProps) {
  if (!event) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Event Details
          </DrawerTitle>
          <DrawerDescription>
            Event ID: <span className="font-mono text-xs">{event.id}</span>
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">
                <Info className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="network">
                <Network className="h-4 w-4 mr-2" />
                Network
              </TabsTrigger>
              <TabsTrigger value="geo">
                <Globe className="h-4 w-4 mr-2" />
                Geo
              </TabsTrigger>
              <TabsTrigger value="ti">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Threat Intel
              </TabsTrigger>
              <TabsTrigger value="raw">
                <Code className="h-4 w-4 mr-2" />
                Raw JSON
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Info className="h-4 w-4" />
                  Basic Information
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
                    <div className="font-mono text-sm">{formatDateTime(event.timestamp)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Event Type</div>
                      <Badge variant="secondary">{event.event_type}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Protocol</div>
                      <Badge variant="outline">{event.protocol.toUpperCase()}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Server className="h-4 w-4" />
                  Sensor
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sensor ID</div>
                    <div className="font-mono text-sm">{event.sensor}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sensor Type</div>
                    <Badge>{event.sensor_type}</Badge>
                  </div>
                </div>
              </div>

              {event.auth && !event.ssh && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Shield className="h-4 w-4" />
                      Credentials
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      {event.auth.username && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Username</div>
                          <div className="font-mono text-sm">{event.auth.username}</div>
                        </div>
                      )}
                      {event.auth.password && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Password</div>
                          <div className="font-mono text-sm">{event.auth.password}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* SSH Credentials */}
              {event.ssh && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Shield className="h-4 w-4" />
                      SSH Credentials
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      {event.ssh.username && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Username</div>
                          <div className="font-mono text-sm">{event.ssh.username}</div>
                        </div>
                      )}
                      {event.ssh.password && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Password</div>
                          <div className="font-mono text-sm">{event.ssh.password}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Command Details */}
              {event.command && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Code className="h-4 w-4" />
                      Command Details
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      {event.command.raw && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Command</div>
                          <div className="font-mono text-sm break-all">{event.command.raw}</div>
                        </div>
                      )}
                      {event.command.category && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Category</div>
                          <Badge variant="outline">{event.command.category}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* File Details for Downloads */}
              {event.event_type === 'file_download' && (event as any).raw && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Shield className="h-4 w-4" />
                      File Details
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      {((event as any).raw.sha256 || (event as any).raw.shasum) && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">SHA-256</div>
                          <div className="font-mono text-sm break-all">{(event as any).raw.sha256 || (event as any).raw.shasum}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* HTTP Details */}
              {event.http && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Network className="h-4 w-4" />
                      HTTP Details
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">URL</div>
                      <div className="font-mono text-sm break-all">{event.http.url}</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Network className="h-4 w-4" />
                  Network Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2">Source IP</div>
                    <div className="font-mono text-lg font-semibold">{event.src_ip}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2">Destination Port</div>
                    <div className="font-mono text-lg font-semibold">{event.dst_port}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2">Protocol</div>
                    <Badge variant="outline" className="text-base">
                      {event.protocol.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2">Event Type</div>
                    <Badge variant="secondary" className="text-base">
                      {event.event_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Geo Tab */}
            <TabsContent value="geo" className="space-y-6">
              {event.geoip ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <Globe className="h-4 w-4" />
                      Geolocation
                    </div>
                    <div className="space-y-4">
                      {event.geoip.country_iso_code && (
                        <div className="bg-muted rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-2">Country</div>
                          <Badge variant="outline" className="text-base font-mono">
                            {event.geoip.country_iso_code}
                          </Badge>
                        </div>
                      )}
                      {event.geoip.city_name && (
                        <div className="bg-muted rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-2">City</div>
                          <div className="text-base">{event.geoip.city_name}</div>
                        </div>
                      )}
                      {event.geoip.location && (
                        <div className="bg-muted rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-2">Coordinates</div>
                          <div className="font-mono text-base">
                            {event.geoip.location.lat.toFixed(4)}, {event.geoip.location.lon.toFixed(4)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No geolocation data available
                </div>
              )}
            </TabsContent>

            {/* Threat Intel Tab */}
            <TabsContent value="ti" className="space-y-6">
              {event.ti ? (
                <>
                  {/* AbuseIPDB */}
                  {event.ti.abuseipdb && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        AbuseIPDB
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-2">Abuse Confidence Score</div>
                        <Badge
                          variant={
                            event.ti.abuseipdb.score >= 90
                              ? 'destructive'
                              : event.ti.abuseipdb.score >= 70
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-lg"
                        >
                          {event.ti.abuseipdb.score}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* VirusTotal */}
                  {event.ti.virustotal && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <Shield className="h-4 w-4" />
                        VirusTotal
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-2">VT Score</div>
                          <div className="text-2xl font-semibold">{event.ti.virustotal.detections}</div>
                        </div>
                        <div className="bg-muted rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-2">Reputation</div>
                          <div className="text-2xl font-semibold">{event.ti.virustotal.reputation}</div>
                        </div>
                      </div>
                      {event.event_type === 'file_download' && (event as any).raw && ((event as any).raw.sha256 || (event as any).raw.shasum) && (
                        <div className="bg-muted rounded-lg p-4 mt-4">
                          <div className="text-xs text-muted-foreground mb-2">File Hash (SHA-256)</div>
                          <div className="font-mono text-xs break-all">{(event as any).raw.sha256 || (event as any).raw.shasum}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MalwareBazaar */}
                  {event.ti.malwarebazaar && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        MalwareBazaar
                      </div>
                      <div className="space-y-4">
                        {event.ti.malwarebazaar.family && (
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2">Malware Family</div>
                            <Badge variant="destructive" className="text-base">
                              {event.ti.malwarebazaar.family}
                            </Badge>
                          </div>
                        )}
                        {event.ti.malwarebazaar.hash && (
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2">Hash</div>
                            <div className="font-mono text-xs break-all">{event.ti.malwarebazaar.hash}</div>
                          </div>
                        )}
                        {event.ti.malwarebazaar.last_seen && (
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-xs text-muted-foreground mb-2">Last Seen</div>
                            <div className="text-sm">{formatDateTime(event.ti.malwarebazaar.last_seen)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MITRE ATT&CK */}
                  {event.ti.mitre && event.ti.mitre.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <Shield className="h-4 w-4" />
                        MITRE ATT&CK Tactics
                      </div>
                      <div className="space-y-2">
                        {event.ti.mitre.map((mitre, idx) => (
                          <div key={idx} className="bg-muted rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium">{mitre.tactic}</div>
                              <div className="text-xs text-muted-foreground">Technique: {mitre.technique}</div>
                              {mitre.id && (
                                <div className="text-xs text-muted-foreground">Technique ID: {mitre.id}</div>
                              )}
                            </div>
                            <Badge variant="secondary">{mitre.technique}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No threat intelligence data available
                </div>
              )}
            </TabsContent>

            {/* Raw JSON Tab */}
            <TabsContent value="raw">
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-xs font-mono overflow-auto max-h-[500px]">
                  {JSON.stringify((event as any).raw ?? event, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
