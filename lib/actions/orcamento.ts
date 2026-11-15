"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CATEGORIAS, ESCOPOS } from "@/lib/formatacao";
import { dinheiro, visao } from "@/lib/validacao";

export async function salvarOrcamentos(formData: FormData) {
  for (const escopo of ESCOPOS) {
    const valor = dinheiro(formData.get(escopo));
    await prisma.orcamento.upsert({ where: { escopo }, create: { escopo, valor }, update: { valor } });
  }
  revalidatePath("/");
  revalidatePath("/orcamento");
  redirect("/orcamento");
}

/** Campo em branco = sem limite para a categoria naquela visão. */
export async function salvarLimites(visaoBruta: string, formData: FormData) {
  const alvo = visao(visaoBruta);
  for (const categoria of CATEGORIAS) {
    const bruto = (formData.get(categoria) ?? "").toString().trim();
    if (bruto === "") {
      await prisma.limiteCategoria.deleteMany({ where: { visao: alvo, categoria } });
    } else {
      const valor = dinheiro(bruto);
      await prisma.limiteCategoria.upsert({
        where: { visao_categoria: { visao: alvo, categoria } },
        create: { visao: alvo, categoria, valor },
        update: { valor },
      });
    }
  }
  revalidatePath("/");
  revalidatePath("/orcamento");
  redirect(`/orcamento?visao=${alvo}`);
}
