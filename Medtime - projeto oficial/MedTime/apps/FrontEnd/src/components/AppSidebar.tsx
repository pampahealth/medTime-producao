
'use client';

import { Home, Pill, Users, FileText, Calendar, ClipboardList, LayoutGrid, BarChart3, TrendingUp, Smartphone } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from './auth/AuthProvider';

const adminItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Pacientes',
    url: '/pacientes',
    icon: Users,
  },
  {
    title: 'Celulares dos Pacientes',
    url: '/paciente-celulares',
    icon: Smartphone,
  },
  {
    title: 'Médicos',
    url: '/medicos',
    icon: ClipboardList,
  },
  {
    title: 'Medicamentos',
    url: '/medicamentos',
    icon: Pill,
  },
  {
    title: 'Receitas',
    url: '/receitas',
    icon: FileText,
  },
  {
    title: 'Agendamento',
    url: '/agendamento-medicamentos',
    icon: Calendar,
  },
  {
    title: 'Grid de Agendamentos',
    url: '/agendamentos-grid',
    icon: LayoutGrid,
  },
  {
    title: 'Relatório de Receitas',
    url: '/relatorio-receitas',
    icon: BarChart3,
  },
  {
    title: 'Análise Pivot',
    url: '/pivot-receitas',
    icon: TrendingUp,
  },
];

const userItems = [
  {
    title: 'Meus Medicamentos',
    url: '/meus-medicamentos',
    icon: Pill,
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const items = user?.isAdmin ? adminItems : userItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
