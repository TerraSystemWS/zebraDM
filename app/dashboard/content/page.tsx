"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { contentService } from "@/services/contentService";
import ImagePicker from "@/components/ImagePicker";

type Locale = "pt" | "en" | "fr";
const LOCALES: { code: Locale; label: string }[] = [
    { code: "pt", label: "Português" },
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
];

export default function ContentEditorPage() {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [locale, setLocale] = useState<Locale>("pt");

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        const data = await contentService.getAllContent();
        setContent(data);
        setLoading(false);
    };

    const handleChange = (section: string, subSection: string, field: string, value: string) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subSection]: {
                    ...prev[section][subSection],
                    [field]: { ...prev[section][subSection][field], [locale]: value }
                }
            }
        }));
    };

    const handleTopLevelChange = (section: string, field: string, value: string) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: { ...prev[section], [field]: { ...prev[section][field], [locale]: value } }
        }));
    };

    const handleWwedoItemChange = (index: number, field: "title" | "text", value: string) => {
        setContent((prev: any) => {
            const newItems = [...prev.home.wwedo.items];
            newItems[index] = { ...newItems[index], [field]: { ...newItems[index][field], [locale]: value } };
            return {
                ...prev,
                home: {
                    ...prev.home,
                    wwedo: {
                        ...prev.home.wwedo,
                        items: newItems
                    }
                }
            };
        });
    };

    const handleAboutItemChange = (index: number, value: string) => {
        setContent((prev: any) => {
            const newItems = [...prev.home.about.items];
            newItems[index] = { ...newItems[index], [locale]: value };
            return {
                ...prev,
                home: {
                    ...prev.home,
                    about: {
                        ...prev.home.about,
                        items: newItems
                    }
                }
            };
        });
    };

    type ListSection = "testimonials" | "newsSection" | "groupTravel";

    const updateListItemField = (section: ListSection, index: number, field: string, value: string, localized: boolean) => {
        setContent((prev: any) => {
            const items = [...prev.home[section].items];
            const current = items[index];
            items[index] = localized
                ? { ...current, [field]: { ...current[field], [locale]: value } }
                : { ...current, [field]: value };
            return { ...prev, home: { ...prev.home, [section]: { ...prev.home[section], items } } };
        });
    };

    const addListItem = (section: ListSection, template: any) => {
        setContent((prev: any) => ({
            ...prev,
            home: {
                ...prev.home,
                [section]: { ...prev.home[section], items: [...(prev.home[section].items ?? []), template] }
            }
        }));
    };

    const removeListItem = (section: ListSection, index: number) => {
        setContent((prev: any) => {
            const items = [...prev.home[section].items];
            items.splice(index, 1);
            return { ...prev, home: { ...prev.home, [section]: { ...prev.home[section], items } } };
        });
    };

    const emptyLocalized = () => ({ pt: "", en: "", fr: "" });

    const handleSave = async () => {
        try {
            const result = await contentService.updateContent(content);
            if (result.success) {
                Swal.fire("Sucesso", "Conteúdo atualizado com sucesso!", "success");
            } else {
                Swal.fire("Erro", "Falha ao atualizar conteúdo", "error");
            }
        } catch (error) {
            console.error("Error saving content:", error);
            Swal.fire("Erro", "Ocorreu um erro inesperado", "error");
        }
    };

    if (loading) {
        return <div className="p-6">Carregando conteúdo...</div>;
    }

    if (!content) {
        return <div className="p-6">Nenhum conteúdo encontrado.</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Editor de Conteúdo Estático</h1>
                    <p className="text-gray-500 dark:text-gray-400">Edite os textos fixos de todo o site aqui, em cada idioma.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                    Salvar Alterações
                </button>
            </header>

            <div className="mb-8 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {LOCALES.map((l) => (
                    <button
                        key={l.code}
                        onClick={() => setLocale(l.code)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${
                            locale === l.code
                                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-8">
                {/* Home Page - Banner Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">1</span>
                        Home Page - Banner
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo (Destaque)</label>
                            <input
                                type="text"
                                value={content.home.banner.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'banner', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título Principal</label>
                            <input
                                type="text"
                                value={content.home.banner.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'banner', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto Descritivo</label>
                            <textarea
                                value={content.home.banner.text[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'banner', 'text', e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do Botão</label>
                            <input
                                type="text"
                                value={content.home.banner.buttonText?.[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'banner', 'buttonText', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Home Page - About Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">2</span>
                        Home Page - Sobre Nós
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.about.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'about', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.about.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'about', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto Principal</label>
                            <textarea
                                value={content.home.about.text[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'about', 'text', e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Lista de Diferenciais</label>
                            <div className="grid gap-2">
                                {content.home.about.items.map((item: any, idx: number) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        value={item[locale] ?? ""}
                                        onChange={(e) => handleAboutItemChange(idx, e.target.value)}
                                        className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">3</span>
                        Rodapé (Footer)
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto Sobre a Empresa</label>
                            <textarea
                                value={content.footer.companyInfo.text[locale] ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setContent((prev: any) => ({
                                        ...prev,
                                        footer: {
                                            ...prev.footer,
                                            companyInfo: { ...prev.footer.companyInfo, text: { ...prev.footer.companyInfo.text, [locale]: value } }
                                        }
                                    }));
                                }}
                                rows={3}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Copyright</label>
                            <input
                                type="text"
                                value={content.footer.copyright[locale] ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setContent((prev: any) => ({
                                        ...prev,
                                        footer: {
                                            ...prev.footer,
                                            copyright: { ...prev.footer.copyright, [locale]: value }
                                        }
                                    }));
                                }}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center text-xl font-bold text-gray-800 dark:text-white">
                            <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">4</span>
                            FAQs
                        </h2>
                    </div>
                    {content.faq.map((tab: any, tabIdx: number) => (
                        <div key={tabIdx} className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Categoria</label>
                            <input
                                type="text"
                                value={tab.label[locale] ?? ""}
                                onChange={(e) => {
                                    const newFaq = [...content.faq];
                                    newFaq[tabIdx] = { ...newFaq[tabIdx], label: { ...newFaq[tabIdx].label, [locale]: e.target.value } };
                                    setContent({ ...content, faq: newFaq });
                                }}
                                className="mb-3 w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-semibold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <div className="grid gap-4">
                                {tab.faqs.map((f: any, faqIdx: number) => (
                                    <div key={faqIdx} className="grid gap-2 border-b border-gray-50 pb-4 last:border-0 dark:border-gray-700">
                                        <input
                                            type="text"
                                            placeholder="Pergunta"
                                            value={f.question[locale] ?? ""}
                                            onChange={(e) => {
                                                const newFaq = [...content.faq];
                                                newFaq[tabIdx].faqs[faqIdx].question = { ...newFaq[tabIdx].faqs[faqIdx].question, [locale]: e.target.value };
                                                setContent({ ...content, faq: newFaq });
                                            }}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        <textarea
                                            placeholder="Resposta"
                                            value={f.answer[locale] ?? ""}
                                            onChange={(e) => {
                                                const newFaq = [...content.faq];
                                                newFaq[tabIdx].faqs[faqIdx].answer = { ...newFaq[tabIdx].faqs[faqIdx].answer, [locale]: e.target.value };
                                                setContent({ ...content, faq: newFaq });
                                            }}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Terms Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">5</span>
                        Termos e Condições
                    </h2>
                    <div className="grid gap-6">
                        {content.terms.map((term: any, idx: number) => (
                            <div key={idx} className="grid gap-2 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={term.title[locale] ?? ""}
                                    onChange={(e) => {
                                        const newTerms = [...content.terms];
                                        newTerms[idx] = { ...newTerms[idx], title: { ...newTerms[idx].title, [locale]: e.target.value } };
                                        setContent({ ...content, terms: newTerms });
                                    }}
                                    className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 font-bold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <textarea
                                    value={term.text[locale] ?? ""}
                                    onChange={(e) => {
                                        const newTerms = [...content.terms];
                                        newTerms[idx] = { ...newTerms[idx], text: { ...newTerms[idx].text, [locale]: e.target.value } };
                                        setContent({ ...content, terms: newTerms });
                                    }}
                                    rows={4}
                                    className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Home Page - Why Choose Us Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">6</span>
                        Home Page - Porque Escolher a ZebraTravel
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.wwedo.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'wwedo', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.wwedo.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'wwedo', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Blocos (6)</label>
                            <div className="grid gap-3">
                                {content.home.wwedo.items.map((item: any, idx: number) => (
                                    <div key={idx} className="grid gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <input
                                            type="text"
                                            placeholder="Título do bloco"
                                            value={item.title[locale] ?? ""}
                                            onChange={(e) => handleWwedoItemChange(idx, "title", e.target.value)}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-semibold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        <textarea
                                            placeholder="Texto do bloco"
                                            value={item.text[locale] ?? ""}
                                            onChange={(e) => handleWwedoItemChange(idx, "text", e.target.value)}
                                            rows={2}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Page - Trending Destinations Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">7</span>
                        Home Page - Destinos em Tendência
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.topdestinos.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'topdestinos', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.topdestinos.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'topdestinos', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Home Page - Products Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">8</span>
                        Home Page - Produtos em Destaque
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.products.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'products', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.products.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'products', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do link "Ver todos"</label>
                            <input
                                type="text"
                                value={content.home.products.seeMore[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'products', 'seeMore', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Home Page - Group Travel Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">9</span>
                        Home Page - Pacotes de Viagem em Grupo
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do link "Ver Detalhes"</label>
                            <input
                                type="text"
                                value={content.home.groupTravel.seeDetails[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'groupTravel', 'seeDetails', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pacotes</label>
                                <button
                                    type="button"
                                    onClick={() => addListItem("groupTravel", {
                                        duration: "", location: "", price: "", link: "#", imageUrl: "",
                                        title: emptyLocalized(), description: emptyLocalized()
                                    })}
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                    + Adicionar Pacote
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {content.home.groupTravel.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pacote #{idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeListItem("groupTravel", idx)}
                                                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                        <ImagePicker
                                            label="Imagem"
                                            value={item.imageUrl ?? ""}
                                            onChange={(url) => updateListItemField("groupTravel", idx, "imageUrl", url, false)}
                                        />
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <input
                                                type="text"
                                                placeholder="Título"
                                                value={item.title?.[locale] ?? ""}
                                                onChange={(e) => updateListItemField("groupTravel", idx, "title", e.target.value, true)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-semibold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Duração (ex: 5 days)"
                                                value={item.duration ?? ""}
                                                onChange={(e) => updateListItemField("groupTravel", idx, "duration", e.target.value, false)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Localização"
                                                value={item.location ?? ""}
                                                onChange={(e) => updateListItemField("groupTravel", idx, "location", e.target.value, false)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Preço (ex: $75)"
                                                value={item.price ?? ""}
                                                onChange={(e) => updateListItemField("groupTravel", idx, "price", e.target.value, false)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Link (ex: #)"
                                                value={item.link ?? ""}
                                                onChange={(e) => updateListItemField("groupTravel", idx, "link", e.target.value, false)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <textarea
                                            placeholder="Descrição"
                                            value={item.description?.[locale] ?? ""}
                                            onChange={(e) => updateListItemField("groupTravel", idx, "description", e.target.value, true)}
                                            rows={2}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Page - Testimonials Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">10</span>
                        Home Page - Testemunhos
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.testimonials.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'testimonials', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.testimonials.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'testimonials', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Depoimentos</label>
                                <button
                                    type="button"
                                    onClick={() => addListItem("testimonials", {
                                        image: "", name: "", designation: emptyLocalized(), text: emptyLocalized(), rating: 5
                                    })}
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                    + Adicionar Depoimento
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {content.home.testimonials.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Depoimento #{idx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeListItem("testimonials", idx)}
                                                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                        <ImagePicker
                                            label="Foto"
                                            value={item.image ?? ""}
                                            onChange={(url) => updateListItemField("testimonials", idx, "image", url, false)}
                                        />
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <input
                                                type="text"
                                                placeholder="Nome"
                                                value={item.name ?? ""}
                                                onChange={(e) => updateListItemField("testimonials", idx, "name", e.target.value, false)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm font-semibold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Designação (ex: Cliente Fidelizado)"
                                                value={item.designation?.[locale] ?? ""}
                                                onChange={(e) => updateListItemField("testimonials", idx, "designation", e.target.value, true)}
                                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <textarea
                                            placeholder="Texto do depoimento"
                                            value={item.text?.[locale] ?? ""}
                                            onChange={(e) => updateListItemField("testimonials", idx, "text", e.target.value, true)}
                                            rows={2}
                                            className="w-full rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Avaliação (1-5 estrelas)</label>
                                            <select
                                                value={item.rating ?? 5}
                                                onChange={(e) => {
                                                    const rating = Number(e.target.value);
                                                    setContent((prev: any) => {
                                                        const items = [...prev.home.testimonials.items];
                                                        items[idx] = { ...items[idx], rating };
                                                        return { ...prev, home: { ...prev.home, testimonials: { ...prev.home.testimonials, items } } };
                                                    });
                                                }}
                                                className="rounded-lg border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Page - News Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">11</span>
                        Home Page - Últimas Novidades
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.newsSection.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'newsSection', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.newsSection.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'newsSection', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                            As notícias mostradas nesta secção da home vêm agora diretamente do <strong>Blog</strong> (as 3 mais recentes) — gere o conteúdo em "Postagens", no menu lateral, em vez de aqui.
                        </div>
                    </div>
                </section>

                {/* Home Page - Newsletter Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">12</span>
                        Home Page - Newsletter
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.subscribe.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.subscribe.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.home.subscribe.text[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'text', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Placeholder do campo de email</label>
                            <input
                                type="text"
                                value={content.home.subscribe.placeholder[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'placeholder', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do botão</label>
                            <input
                                type="text"
                                value={content.home.subscribe.button[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'button', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem de sucesso</label>
                            <input
                                type="text"
                                value={content.home.subscribe.successMessage[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'successMessage', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem de erro</label>
                            <input
                                type="text"
                                value={content.home.subscribe.errorMessage[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'subscribe', 'errorMessage', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Home Page - Popular Excursions Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">13</span>
                        Home Page - Excursões Mais Populares
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subtítulo</label>
                            <input
                                type="text"
                                value={content.home.tourspop.subtitle[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'tourspop', 'subtitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.home.tourspop.title[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'tourspop', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rótulo "dias"</label>
                            <input
                                type="text"
                                value={content.home.tourspop.daysLabel[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'tourspop', 'daysLabel', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rótulo "Avaliações"</label>
                            <input
                                type="text"
                                value={content.home.tourspop.reviewsLabel[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'tourspop', 'reviewsLabel', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do link "Ver Detalhes"</label>
                            <input
                                type="text"
                                value={content.home.tourspop.seeDetails[locale] ?? ""}
                                onChange={(e) => handleChange('home', 'tourspop', 'seeDetails', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Header Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">14</span>
                        Cabeçalho da Página de FAQs
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.faqHeader.title[locale] ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setContent((prev: any) => ({
                                        ...prev,
                                        faqHeader: { ...prev.faqHeader, title: { ...prev.faqHeader.title, [locale]: value } }
                                    }));
                                }}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.faqHeader.text[locale] ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setContent((prev: any) => ({
                                        ...prev,
                                        faqHeader: { ...prev.faqHeader, text: { ...prev.faqHeader.text, [locale]: value } }
                                    }));
                                }}
                                rows={3}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Loja Page Header */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">15</span>
                        Página da Loja
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.loja.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('loja', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.loja.text[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('loja', 'text', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do botão "Carregar Mais"</label>
                            <input
                                type="text"
                                value={content.loja.seeMore[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('loja', 'seeMore', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Excursoes Page Header */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">16</span>
                        Página de Excursões
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.excursoes.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('excursoes', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.excursoes.text[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('excursoes', 'text', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Hotel List Page Header */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">17</span>
                        Página de Lista de Hotéis
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.hotelList.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('hotelList', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.hotelList.text[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('hotelList', 'text', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem quando não há hotéis</label>
                            <input
                                type="text"
                                value={content.hotelList.empty[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('hotelList', 'empty', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Page */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">18</span>
                        Página de Contacto
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título do formulário</label>
                            <input
                                type="text"
                                value={content.contact.formTitle[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('contact', 'formTitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título "Encontre-nos"</label>
                            <input
                                type="text"
                                value={content.contact.findUsTitle[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('contact', 'findUsTitle', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto do formulário</label>
                            <textarea
                                value={content.contact.formText[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('contact', 'formText', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto "Encontre-nos"</label>
                            <textarea
                                value={content.contact.findUsText[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('contact', 'findUsText', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Galeria Page */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">19</span>
                        Página da Galeria
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.galeria.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('galeria', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <input
                                type="text"
                                value={content.galeria.text[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('galeria', 'text', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">20</span>
                        Secção da Equipa (página Sobre Nós)
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.team.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('team', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Destinos Page Header */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 flex items-center text-xl font-bold text-gray-800 dark:text-white">
                        <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">21</span>
                        Página de Destinos
                    </h2>
                    <div className="grid gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                            <input
                                type="text"
                                value={content.destinosPage.title[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('destinosPage', 'title', e.target.value)}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                            <textarea
                                value={content.destinosPage.text[locale] ?? ""}
                                onChange={(e) => handleTopLevelChange('destinosPage', 'text', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
